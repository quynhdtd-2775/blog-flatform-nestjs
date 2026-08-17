import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsBeforeDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBeforeDate',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (typeof value !== 'string' || typeof relatedValue !== 'string') {
            return true;
          }

          const date = new Date(value);
          const relatedDate = new Date(relatedValue);

          // Malformed dates are @IsDateString()'s concern, not this validator's —
          // don't mask its error message with an unrelated "must be before" one.
          if (
            Number.isNaN(date.getTime()) ||
            Number.isNaN(relatedDate.getTime())
          ) {
            return true;
          }

          return date.getTime() < relatedDate.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be before ${relatedPropertyName}`;
        },
      },
    });
  };
}
