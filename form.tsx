import { Button } from "@/components/forms/button";
import { ErrorMessage } from "@/components/forms/error-message";
import { Form, FormGroup } from "@/components/forms/form";
import { Input } from "@/components/forms/input";
import { useFetch } from "@/hooks/useFetch";
import { useForm } from "@/hooks/useForm";
import { createEffect, Show } from "solid-js";
import { signInSchema } from "./schema";
import { useNavigate } from "@solidjs/router";
import { InferType } from "yup";
import { AlertGeneric } from "@/components/forms/alerts";
import { APIResponseReturn } from "@/lib/api";

const SignInForm = () => {
  const { form, register, handleSubmit, errors } = useForm<InferType<typeof signInSchema>>(signInSchema);
  const { fetchData, response } = useFetch<APIResponseReturn>();
  const navigate = useNavigate();

  const onSubmit = async (data: InferType<typeof signInSchema>) => {
    await fetchData(`${import.meta.env.VITE_API_BASE_URL}/sign-in`, {
      method: "POST",
      body: data,
    });
  };

  createEffect(() => response()?.success && setTimeout(() => navigate("/"), 1000));
  return (
    <div>
      <Form {...form} onsubmit={handleSubmit(onSubmit)} class="flex flex-col gap-3">
        <Show when={!response.loading && response()}>{
          (res) => typeof res().body === "string" && 
            <AlertGeneric>{String(res().body)}</AlertGeneric>
        }</Show>
        <FormGroup class="flex flex-col">
          <Input 
            type="text" 
            placeholder="Username"
            {...register("username")} 
          />
          <ErrorMessage error={errors().username} />
        </FormGroup>
        <FormGroup class="flex flex-col">
          <Input 
            type="password" 
            placeholder="Password"
            {...register("password")} 
          />
          <ErrorMessage error={errors().password} />
        </FormGroup>
        <Button type="submit">Submit</Button>
      </Form>
    </div>
  );
};

export { SignInForm };