import { getDeep, setDeep } from './accessDeep';
import { isPrimitive, isString } from './is';
import { Walker } from './plainer';
import {
  TypeAnnotation,
  isTypeAnnotation,
  transformValue,
  untransformValue,
} from './transformer';
import { PathTree } from './pathtree';

export interface Annotations {
  values?: PathTree.CollapsedRootTree<TypeAnnotation>;
  referentialEqualities?: PathTree.CollapsedRootTree<
    PathTree.CollapsedRootTree<string>
  >;
}

export function isAnnotations(object: any): object is Annotations {
  try {
    if (object.values) {
      if (!PathTree.isMinimizedTree(object.values, isTypeAnnotation)) {
        return false;
      }
    }

    if (object.referentialEqualities) {
      if (
        !PathTree.isMinimizedTree(object.referentialEqualities, tree =>
          PathTree.isMinimizedTree(tree, isString)
        )
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

class ValueAnnotationFactory {
  private tree = PathTree.create<TypeAnnotation | null>(null);

  add(path: any[], annotation: TypeAnnotation) {
    PathTree.append(this.tree, path, annotation);
  }

  create() {
    PathTree.compress(this.tree);
    return PathTree.collapseRoot(this.tree);
  }
}

class ReferentialEqualityAnnotationFactory {
  private readonly objectIdentities = new Map<any, any[][]>();

  register(object: any, path: any[]) {
    const paths = this.objectIdentities.get(object) ?? [];
    paths.push(path);
    this.objectIdentities.set(object, paths);
  }

  create() {
    let tree = PathTree.create<PathTree.CollapsedRootTree<string> | null>(null);

    this.objectIdentities.forEach(paths => {
      if (paths.length <= 1) {
        return;
      }

      const [shortestPath, ...identicalPaths] = paths
        .map(path => path.map(String))
        .sort((a, b) => a.length - b.length);

      let identities = PathTree.create<string | null>(null);
      identicalPaths.forEach(identicalPath => {
        PathTree.appendPath(identities, identicalPath);
      });

      const minimizedIdentities = PathTree.collapseRoot(identities);
      if (!minimizedIdentities) {
        throw new Error('Illegal State');
      }

      PathTree.append(tree, shortestPath, minimizedIdentities);
    });

    return PathTree.collapseRoot(tree);
  }
}

class AnnotationFactory {
  public readonly valueAnnotations = new ValueAnnotationFactory();
  public readonly objectIdentities = new ReferentialEqualityAnnotationFactory();

  create(): Annotations {
    const annotations: Annotations = {};

    const values = this.valueAnnotations.create();
    if (values) {
      annotations.values = values;
    }

    const referentialEqualities = this.objectIdentities.create();
    if (referentialEqualities) {
      annotations.referentialEqualities = referentialEqualities;
    }

    return annotations;
  }
}

export const makeAnnotator = () => {
  const annotationFactory = new AnnotationFactory();
  const { valueAnnotations, objectIdentities } = annotationFactory;

  const annotator: Walker = ({ path, node }) => {
    if (!isPrimitive(node)) {
      objectIdentities.register(node, path);
    }

    const transformed = transformValue(node);

    if (transformed) {
      valueAnnotations.add(path, transformed.type);
      return transformed.value;
    } else {
      return node;
    }
  };

  return { getAnnotations: () => annotationFactory.create(), annotator };
};

export const applyAnnotations = (plain: any, annotations: Annotations): any => {
  if (annotations.values) {
    PathTree.traverseWhileIgnoringNullRoot(
      PathTree.expandRoot(annotations.values),
      (type, path) => {
        plain = setDeep(plain, path, v => untransformValue(v, type));
      }
    );
  }

  if (annotations.referentialEqualities) {
    PathTree.traverseWhileIgnoringNullRoot(
      PathTree.expandRoot(annotations.referentialEqualities),
      (identicalObjects, path) => {
        const object = getDeep(plain, path);

        PathTree.traversePaths(
          PathTree.expandRoot(identicalObjects),
          identicalObjectPath => {
            plain = setDeep(plain, identicalObjectPath, () => object);
          }
        );
      }
    );
  }

  return plain;
};
