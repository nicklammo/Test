import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import { AnyObject, ObjectSchema, ValidationError } from "yup";

type UseFormReturn<T> = {
  form: (element: HTMLFormElement) => void;
  register: (name: string) => { name: string; ref: (element: HTMLInputElement) => void };
  handleSubmit: (onSubmit: (data: FormDataMap<T>) => void) => (event: SubmitEvent) => void;
  errors: Accessor<Partial<FormDataMap<T>>>;
};

type FormDataMap<T> = { [K in keyof T]: string };

const useForm = <T extends AnyObject>(schema: ObjectSchema<T>): UseFormReturn<T> => {
  let formControl: HTMLFormElement | null = null;
  const fields: { [key: string]: HTMLInputElement } = {};
  const [formData, setFormData] = createSignal<FormDataMap<T> | {}>({}); 
  const [errors, setErrors] = createSignal<Partial<FormDataMap<T>>>({});

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
    };
  };

  const reduceFields = () => {
    return Object.keys(fields).reduce((acc, key) => {
      acc[key as keyof T] = fields[key].value;
      return acc;
    }, {} as FormDataMap<T>);
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

  createEffect(() => {
    if (formControl) {
      const inputHandler = debounce(async (event: InputEvent) => {
        const target = event.target as HTMLInputElement;
        const field = fields[target.name];
        if (!field) return; // Ignore unregistered fields
        setFormData(() => reduceFields());
        if (schema && schema instanceof ObjectSchema) {
          try {
            await (schema as ObjectSchema<T>).validateAt(field.name, formData() as FormDataMap<T>);
            setErrors(prevErrors => {
              const { [field.name as keyof T]: _, ...errors } = prevErrors;
              return errors as Partial<FormDataMap<T>>;
            });
            fields[target.name].style.border = "1px solid #22c55e";
            fields[target.name].style.outlineColor = "#22c55e";
          } catch (error) {
            if (error instanceof ValidationError) {
              setErrors(prevErrors => ({
                ...prevErrors,
                [field.name]: error.message,
              }));
              field.style.border = "1px solid #ef4444";
              field.style.outlineColor = "#ef4444";
            };
          };
        };
      });
      formControl.addEventListener("input", inputHandler);
      onCleanup(() => formControl?.removeEventListener("input", inputHandler));
    };
  });

  const handleSubmit = (onSubmit: (data: FormDataMap<T>) => void) => {
    return async (event: SubmitEvent) => {
      event.preventDefault();
      setFormData(() => reduceFields());
      if (schema && schema instanceof ObjectSchema) {
        try {
          setErrors({});
          await (schema as ObjectSchema<T>).validate(formData(), {
            abortEarly: false,
          });
        } catch (error) {
          const newErrors: Partial<FormDataMap<T>> = {};
          if (error instanceof ValidationError) {
            if (error.inner) {
              error.inner.forEach((error) => {
                if (error.path) newErrors[error.path as keyof T] = error.message;
              });
            };
          };
          setErrors((prevErrors) => ({
            ...prevErrors,
            ...newErrors,
          }));
          return;
        };
      };
      return onSubmit(formData() as FormDataMap<T>);
    };
  };
  return { form, register, handleSubmit, errors };
}

export { useForm };
