export const allowedErrorProps: string[] = [];

export const allowErrorProps = (...props: string[]) => {
  allowedErrorProps.push(...props);
};
