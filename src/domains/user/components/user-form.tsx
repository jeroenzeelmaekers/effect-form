import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getLanguageLabel, languages } from "@/domains/language/model";
import {
  createUserOptimisticAtom,
  optimisticGetUsersAtom,
} from "@/domains/user/atoms";
import { UserForm } from "@/domains/user/model";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

export default function EffectForm() {
  const createUser = useAtomSet(createUserOptimisticAtom);
  const usersResult = useAtomValue(optimisticGetUsersAtom);
  const isDisabled =
    AsyncResult.isFailure(usersResult) ||
    AsyncResult.isWaiting(usersResult) ||
    AsyncResult.isInitial(usersResult);

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  const form = useForm({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      language: "",
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: Schema.toStandardSchemaV1(UserForm),
    },
    onSubmit: ({ formApi }) => {
      setSubmitStatus("pending");
      createUser({ _tag: "UserForm", ...formApi.state.values });
      formApi.reset();
    },
  });

  // Detect when the optimistic update settles: waiting -> success means the
  // server confirmed the create, so we can show a success message.
  // waiting -> failure means the optimistic update was rolled back.
  const prevWaiting = useRef(false);
  useEffect(() => {
    const isWaiting = AsyncResult.isWaiting(usersResult);
    if (submitStatus === "pending") {
      if (prevWaiting.current && !isWaiting) {
        if (AsyncResult.isSuccess(usersResult)) {
          setSubmitStatus("success");
        } else if (AsyncResult.isFailure(usersResult)) {
          setSubmitStatus("error");
        }
      }
    }
    prevWaiting.current = isWaiting;
  }, [usersResult, submitStatus]);

  // Clear success/error message after delay
  useEffect(() => {
    if (submitStatus !== "success" && submitStatus !== "error") return;
    const timer = setTimeout(() => setSubmitStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [submitStatus]);

  // Warn before navigating away with unsaved changes
  const isDirty = form.state.isDirty;
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <Card
      className="h-fit w-full lg:max-w-sm lg:min-w-sm"
      size="sm"
      data-testid="user-form">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        noValidate
        className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>
            Add a new user with optimistic updates
          </CardDescription>
        </CardHeader>
        <fieldset
          disabled={isDisabled}
          data-testid="user-form-fieldset"
          className="flex flex-col gap-5">
          <CardContent className="flex flex-col gap-4">
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name:</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      data-testid="user-form-name"
                      autoComplete="name"
                      placeholder="Jane Doe…"
                      required
                      aria-invalid={isInvalid || undefined}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {isInvalid && (
                      <FieldError
                        data-testid="user-form-name-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="username"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Username:</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        data-testid="user-form-username"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="janedoe…"
                        required
                        aria-invalid={isInvalid || undefined}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <InputGroupAddon>
                        <span aria-hidden="true">@</span>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError
                        data-testid="user-form-username-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email:</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        data-testid="user-form-email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="jane@example.com…"
                        required
                        aria-invalid={isInvalid || undefined}
                        aria-describedby="email-help-text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <InputGroupAddon align="inline-end">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <InputGroupButton
                                variant="ghost"
                                aria-label="Help"
                                size="icon-xs">
                                <HelpCircle />
                              </InputGroupButton>
                            }></TooltipTrigger>
                          <TooltipContent id="email-help-text">
                            <p>We&apos;ll use this to send you notifications</p>
                          </TooltipContent>
                        </Tooltip>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError
                        data-testid="user-form-email-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="language"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field orientation="responsive" data-invalid={isInvalid}>
                    <FieldLabel htmlFor="effect-form-select-language">
                      Language:
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value ?? "")
                      }>
                      <SelectTrigger
                        id="effect-form-select-language"
                        data-testid="user-form-language"
                        aria-required="true"
                        aria-invalid={isInvalid || undefined}>
                        <SelectValue>
                          {getLanguageLabel(field.state.value) ?? "Select"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError
                        data-testid="user-form-language-error"
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {submitStatus === "success" && (
              <p
                role="status"
                aria-live="polite"
                className="text-xs text-green-600 dark:text-green-400">
                User created successfully
              </p>
            )}
            {submitStatus === "error" && (
              <p
                role="alert"
                aria-live="assertive"
                className="text-destructive text-xs">
                Failed to create user. Please try again.
              </p>
            )}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  data-testid="user-form-submit"
                  className="w-full">
                  {isSubmitting ? "Creating\u2026" : "Create User"}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </fieldset>
      </form>
    </Card>
  );
}
