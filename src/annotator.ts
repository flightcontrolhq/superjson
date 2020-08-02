import { getDeep, setDeep } from './accessDeep';
import { isPrimitive, isString } from './is';
import * as IteratorUtils from './iteratorutils';
import { Walker } from './plainer';
import {
  TypeAnnotation,
  //  isTypeAnnotation,
  transformValue,
  untransformValue,
  isTypeAnnotation,
} from './transformer';
import {
  TreeEntry,
  treeify,
  detreeify,
  Tree,
  treeifyPaths,
  detreeifyPaths,
  isTree,
} from './treeifier';
import * as TreeCompressor from './treecompressor';

export interface Annotations {
  values?: Tree<TypeAnnotation>;
  referentialEqualities?: Tree<Tree<string>>;
}

export function isAnnotations(object: any): object is Annotations {
  try {
    if (object.values) {
      if (!isTree(object.values, isTypeAnnotation)) {
        return false;
      }
    }

    if (object.referentialEqualities) {
      if (
        !isTree(object.referentialEqualities, tree => isTree(tree, isString))
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

export const makeAnnotator = () => {
  const valueAnnotations: TreeEntry<TypeAnnotation>[] = [];

  const objectIdentities = new Map<any, any[][]>();
  function registerObjectPath(object: any, path: any[]) {
    const paths = objectIdentities.get(object) ?? [];
    paths.push(path);
    objectIdentities.set(object, paths);
  }

  const annotator: Walker = ({ path, node }) => {
    if (!isPrimitive(node)) {
      registerObjectPath(node, path);
    }

    const transformed = transformValue(node);

    if (transformed) {
      valueAnnotations.push({
        path: path.map(String),
        value: transformed.type,
      });

      return transformed.value;
    } else {
      return node;
    }
  };

  function getAnnotations(): Annotations {
    const annotations: Annotations = {};

    const annotationsValuesTree = TreeCompressor.compress(
      treeify(valueAnnotations)
    );
    if (Object.keys(annotationsValuesTree).length > 0) {
      annotations.values = annotationsValuesTree;
    }

    const referentialEqualitiesTreeEntries = IteratorUtils.flatMap<
      any[][],
      TreeEntry<Tree<string>>
    >(objectIdentities.values(), paths => {
      if (paths.length <= 1) {
        return [];
      }

      const [shortestPath, ...identityPaths] = paths.sort(
        (a, b) => a.length - b.length
      );
      return [
        {
          path: shortestPath,
          value: TreeCompressor.compress(treeifyPaths(identityPaths)!),
        },
      ];
    });

    const annotationsReferentialEqualitiesTree = TreeCompressor.compress(
      treeify(referentialEqualitiesTreeEntries)
    );
    if (Object.keys(annotationsReferentialEqualitiesTree).length > 0) {
      annotations.referentialEqualities = annotationsReferentialEqualitiesTree;
    }

    return annotations;
  }

  return { getAnnotations, annotator };
};

export const applyAnnotations = (plain: any, annotations: Annotations): any => {
  if (annotations.values) {
    const valueAnnotations = detreeify(
      TreeCompressor.uncompress(annotations.values)
    );

    valueAnnotations.forEach(({ path, value: type }) => {
      plain = setDeep(plain, path, v => untransformValue(v, type));
    });
  }

  if (annotations.referentialEqualities) {
    const referentialEqualitiesAnnotations = detreeify(
      TreeCompressor.uncompress(annotations.referentialEqualities)
    );
    for (const { path, value } of referentialEqualitiesAnnotations) {
      const object = getDeep(plain, path);

      const identicalObjectPaths = detreeifyPaths(
        TreeCompressor.uncompress(value)
      );
      for (const identicalObjectPath of identicalObjectPaths) {
        setDeep(plain, identicalObjectPath, () => object);
      }
    }
  }

  return plain;
};
