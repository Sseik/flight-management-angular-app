/* eslint-disable @typescript-eslint/no-explicit-any */
export function Log() {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(`📢 [LOG] Виклик методу: "${propertyKey}"`, args);
      
      const result = originalMethod.apply(this, args);
      
      return result;
    };

    return descriptor;
  };
}