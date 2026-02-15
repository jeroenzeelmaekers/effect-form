import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { HelpCircle } from "lucide-react";
import { useEffect, useState } from 'react';

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
import { Label } from "@/shared/components/ui/label";
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
    Result.isFailure(usersResult) ||
    Result.isWaiting(usersResult) ||
    Result.isInitial(usersResult);

  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const form = useForm({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      language: "",
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(UserForm),
    },
    onSubmit: ({ formApi }) => {
      createUser(formApi.state.values);
      formApi.reset();
      setSubmitStatus('success');
    },
  });

  // Clear success message after delay
  useEffect(() => {
    if (submitStatus !== 'success') return;
    const timer = setTimeout(() => setSubmitStatus('idle'), 1000);
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
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <InputGroupAddon>
                        <Label htmlFor={field.name}>@</Label>
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
                          <TooltipContent>
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
                        data-testid="user-form-language">
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
            {submitStatus === 'success' && (
              <p
                role="status"
                aria-live="polite"
                className="text-xs text-green-600 dark:text-green-400">
                User created successfully
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
