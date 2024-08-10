import { Accessor, createEffect, createSignal } from "solid-js";
import { AnyObject, ObjectSchema, ValidationError } from "yup";

type UseFormReturn<T> = {
  form: (element: HTMLFormElement) => void;
  register: (name: string) => { name: string; ref: (element: HTMLInputElement) => void; oninput: (event: InputEvent) => void };
  handleSubmit: (onSubmit: (data: { [K in keyof T]: string }) => void) => (event: SubmitEvent) => void;
  errors: Accessor<Partial<{ [K in keyof T]: string }>>;
};

const useForm = <T extends AnyObject>(schema: ObjectSchema<T>): UseFormReturn<T> => {
  let formControl: HTMLFormElement | null = null;
  const fields: { [key: string]: HTMLInputElement } = {};
  const [errors, setErrors] = createSignal<Partial<{ [K in keyof T]: string }>>({});

  const form = () => {
    return {
      ref: (element: HTMLFormElement) => {
        formControl = element;
      },
    };
  };

  const register = (name: string) => {
    return {
      name,
      ref: (element: HTMLInputElement) => {
        fields[name] = element;
      },
      oninput: (event: InputEvent) => {
        const target = event.target as HTMLInputElement;
        fields[name].value = target.value;
      },
    };
  };

  const debounce = (callback: (...args: any[]) => void) => {
    let timer: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        callback(...args);
      }, 500);
    };
  };

  const reduce = (_data: { [key: string]: HTMLInputElement }) => {
    return Object.keys(_data).reduce((acc, key) => {
      acc[key as keyof T] = fields[key].value;
      return acc;
    }, {} as { [K in keyof T]: string });
  };

  createEffect(() => {
    if (formControl) {
      const inputHandler = debounce(async (event: InputEvent) => {
        const target = event.target as HTMLInputElement;
        if (schema && schema instanceof ObjectSchema) {
          try {
            await (schema as ObjectSchema<T>).validateAt(target.name, reduce(fields));
            setErrors(prevErrors => {
              const { [target.name as keyof T]: _, ...errors } = prevErrors;
              return errors as Partial<{ [K in keyof T]: string }>;
            });
          } catch (error) {
            if (error instanceof ValidationError) {
              setErrors(prevErrors => ({
                ...prevErrors,
                [target.name]: error.message,
              }));
            };
          };
        };
      });
      formControl.addEventListener("input", inputHandler);
    };
  });

  const handleSubmit = (onSubmit: (data: { [K in keyof T]: string }) => void) => {
    return async (event: Event) => {
      event.preventDefault();
      const data = reduce(fields);
      if (schema && schema instanceof ObjectSchema) {
        try {
          setErrors({});
          await (schema as ObjectSchema<T>).validate(data, {
            abortEarly: false,
          });
        } catch (error) {
          const _errors: Partial<{ [K in keyof T]: string }> = {};
          if (error instanceof ValidationError) {
            if (error.inner) {
              error.inner.forEach((error) => {
                if (error.path) _errors[error.path as keyof T] = error.message;
              });
            };
          };
          setErrors((prevErrors) => ({
            ...prevErrors,
            ..._errors,
          }));
          return;
        };
      };
      return onSubmit(data);
    };
  };
  return { form, register, handleSubmit, errors };
}

export { useForm };