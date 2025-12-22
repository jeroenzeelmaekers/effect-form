import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { Schema } from "effect";

const languages = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
];

const languageValues = languages.map((lang) => lang.value);

function getLanguageLabel(value: string): string | undefined {
  return languages.find((lang) => lang.value === value)?.label;
}

const UserStruct = Schema.Struct({
  firstName: Schema.String.pipe(
    Schema.minLength(1, { message: () => "First name is required" }),
    Schema.maxLength(15, {
      message: () => "First name can max be 20 characters",
    }),
  ),
  lastName: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Last name is required" }),
    Schema.maxLength(15, {
      message: () => "Last name can max be 20 characters",
    }),
  ),
  language: Schema.String.pipe(
    Schema.filter((value) =>
      languageValues.includes(value) ? undefined : "Select a language",
    ),
  ),
});

const UserFormSchema = Schema.standardSchemaV1(UserStruct);

export default function EffectForm() {
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      language: "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UserFormSchema,
    },
    onSubmit: ({ value }) => {
      console.log("Form Submitted:", value);
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>Effect Form Example</CardTitle>
          <CardDescription>Using Effect Schema for validation</CardDescription>
          <CardAction>
            <ModeToggle />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.Field
            name="firstName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>First name:</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="lastName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Last name:</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                    onValueChange={(value) => field.handleChange(value ?? "")}
                  >
                    <SelectTrigger id="effect-form-select-language">
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
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </CardContent>
        <CardFooter>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
