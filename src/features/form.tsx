import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { ModeToggle } from '@/components/ui/mode-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  createUserOptimisticAtom,
  optimisticGetUsersAtom,
} from '@/lib/api/user.atoms';
import { getLanguageLabel, languages } from '@/models/language';
import { UserForm } from '@/models/user';
import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { Schema } from 'effect';
import { HelpCircle } from 'lucide-react';

const UserFormSchema = Schema.standardSchemaV1(UserForm);

export default function EffectForm() {
  const createUser = useAtomSet(createUserOptimisticAtom);
  const usersResult = useAtomValue(optimisticGetUsersAtom);
  const isDisabled =
    Result.isFailure(usersResult) ||
    Result.isWaiting(usersResult) ||
    Result.isInitial(usersResult);

  const form = useForm({
    defaultValues: {
      name: '',
      username: '',
      email: '',
      language: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UserFormSchema,
    },
    onSubmit: ({ value }) => {
      createUser(value);
      form.reset();
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  }

  return (
    <Card className="h-fit w-full lg:max-w-sm lg:min-w-sm" size="sm">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>
            Add a new user with optimistic updates
          </CardDescription>
          <CardAction>
            <ModeToggle />
          </CardAction>
        </CardHeader>
        <fieldset disabled={isDisabled} className="flex flex-col gap-5">
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
                      autoComplete="name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
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
                        autoComplete="username"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <InputGroupAddon>
                        <Label htmlFor={field.name}>@</Label>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
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
                        type="email"
                        autoComplete="email"
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
                      <FieldError errors={field.state.meta.errors} />
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
                        field.handleChange(value ?? '')
                      }>
                      <SelectTrigger id="effect-form-select-language">
                        <SelectValue>
                          {getLanguageLabel(field.state.value) ?? 'Select'}
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
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
          <CardFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </fieldset>
      </form>
    </Card>
  );
}
