export const validateRequired = (value: string, propertyName: string) => {
  if (value.length < 1) {
    return `${propertyName} cannot be empty.`;
  }

  return undefined;
};
