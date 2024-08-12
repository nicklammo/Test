import { Button } from "@/components/forms/button";
import { ErrorMessage } from "@/components/forms/error-message";
import { Form, FormGroup } from "@/components/forms/form";
import { Input } from "@/components/forms/input";
import { useFetch } from "@/hooks/useFetch";
import { useForm } from "@/hooks/useForm";
import { SignUpSchema, signUpSchema } from "./schema";
import { createEffect, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { InferType } from "yup";
import { AlertGeneric } from "@/components/forms/alerts";
import { APIResponseReturn } from "@/lib/api";

const SignUpForm = () => {
  const { form, register, handleSubmit, errors } =
    useForm<SignUpSchema>(signUpSchema);
  const { fetchData, response } = useFetch<APIResponseReturn>();
  const navigate = useNavigate();

  const onSubmit = async (data: InferType<typeof signUpSchema>) => {
    await fetchData(`${import.meta.env.VITE_API_BASE_URL}/sign-up`, {
      method: "POST",
      body: data,
    });
  };

  const formGroupClass = "flex flex-col gap-1.5";

  createEffect(() => response.success && setTimeout(() => navigate("/"), 1000));
  return (
    <div>
      <Form
        {...form}
        onsubmit={handleSubmit(onSubmit)}
        class="flex flex-col gap-3"
      >
        <Show when={response.body}>
          <AlertGeneric>{response.body as string}</AlertGeneric>
        </Show>
        <FormGroup class={formGroupClass}>
          <Input type="text" placeholder="Username" {...register("username")} />
          <ErrorMessage error={errors().username} />
        </FormGroup>
        <FormGroup class="flex flex-col gap-1.5">
          <Input type="text" placeholder="Email" {...register("email")} />
          <ErrorMessage error={errors().email} />
        </FormGroup>
        <FormGroup class={formGroupClass}>
          <Input
            type="password"
            placeholder="Password"
            {...register("password")}
          />
          <ErrorMessage error={errors().password} />
        </FormGroup>
        <FormGroup class={formGroupClass}>
          <Input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword")}
          />
          <ErrorMessage error={errors().confirmPassword} />
        </FormGroup>
        <Button type="submit">Submit</Button>
      </Form>
    </div>
  );
};

export { SignUpForm };
