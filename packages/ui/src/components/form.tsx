import type * as LabelPrimitive from '@radix-ui/react-label'
import type { HTMLMotionProps } from 'motion/react'
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProviderProps,
  SubmitHandler,
} from 'react-hook-form'
import { cn } from '@connnect/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { motion } from 'motion/react'
import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
} from 'react-hook-form'
import { Label } from './label'

// eslint-disable-next-line ts/no-explicit-any
function Form<TFieldValues extends FieldValues = FieldValues, TContext = any, TTransformedValues extends FieldValues | undefined = undefined>({
  children,
  onSubmit,
  watch,
  getValues,
  getFieldState,
  setError,
  clearErrors,
  setValue,
  trigger,
  formState,
  resetField,
  reset,
  handleSubmit,
  unregister,
  control,
  register,
  setFocus,
  ...props
}: FormProviderProps<TFieldValues, TContext, TTransformedValues> & {
  children: React.ReactNode
  onSubmit: TTransformedValues extends undefined ? SubmitHandler<TFieldValues> : TTransformedValues extends FieldValues ? SubmitHandler<TTransformedValues> : never
} & Omit<React.ComponentProps<'form'>, 'onSubmit'>) {
  return (
    <FormProvider
      {...{
        watch,
        getValues,
        getFieldState,
        setError,
        clearErrors,
        setValue,
        trigger,
        formState,
        resetField,
        reset,
        handleSubmit,
        unregister,
        control,
        register,
        setFocus,
      }}
    >
      <form
        {...props}
        onSubmit={handleSubmit(onSubmit)}
      >
        {children}
      </form>
    </FormProvider>
  )
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(null!)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext>
  )
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(null!)

function FormItem({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement> }) {
  const id = React.useId()

  return (
    <FormItemContext value={{ id }}>
      <div ref={ref} className={cn('space-y-1', className)} {...props} />
    </FormItemContext>
  )
}
FormItem.displayName = 'FormItem'

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

function FormLabel({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { ref?: React.RefObject<React.ComponentRef<typeof LabelPrimitive.Root>> }) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}
FormLabel.displayName = 'FormLabel'

function FormControl({ ref, ...props }: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.RefObject<React.ComponentRef<typeof Slot>> }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}
FormControl.displayName = 'FormControl'

function FormDescription({ ref, className, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement> }) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}
FormDescription.displayName = 'FormDescription'

function FormMessage({ ref, className, children, ...props }: HTMLMotionProps<'p'> & { ref?: React.RefObject<HTMLParagraphElement> }) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  return (
    <motion.p
      ref={ref}
      id={formMessageId}
      className={cn('text-xs text-destructive', className)}
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: body ? 16 : 0,
        opacity: body ? 1 : 0,
      }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {body}
    </motion.p>
  )
}
FormMessage.displayName = 'FormMessage'

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  // eslint-disable-next-line react-refresh/only-export-components
  useFormField,
}
