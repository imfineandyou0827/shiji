import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import styles from './forms.module.css';

interface FieldContextValue {
  controlId: string;
  describedBy?: string;
}

const FieldContext = createContext<FieldContextValue | null>(null);

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  return (
    <FieldContext.Provider value={{ controlId, describedBy: hint ? hintId : undefined }}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={controlId}>
          {label}
        </label>
        {children}
        {hint && (
          <span className={styles.hint} id={hintId}>
            {hint}
          </span>
        )}
      </div>
    </FieldContext.Provider>
  );
}

export function TextInput({
  className,
  id,
  'aria-describedby': describedBy,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const field = useContext(FieldContext);
  return (
    <input
      id={id ?? field?.controlId}
      aria-describedby={describedBy ?? field?.describedBy}
      className={[styles.input, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export function TextArea({
  className,
  id,
  'aria-describedby': describedBy,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const field = useContext(FieldContext);
  return (
    <textarea
      id={id ?? field?.controlId}
      aria-describedby={describedBy ?? field?.describedBy}
      className={[styles.input, styles.textarea, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  id,
  'aria-describedby': describedBy,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const field = useContext(FieldContext);
  return (
    <select
      id={id ?? field?.controlId}
      aria-describedby={describedBy ?? field?.describedBy}
      className={[styles.input, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </select>
  );
}
