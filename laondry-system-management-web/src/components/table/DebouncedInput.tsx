import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onValueChange: (v: string) => void;
  delay?: number;
};

const DebouncedInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, delay = 400, ...rest }, ref) => {
    const [inner, setInner] = React.useState(value);

    React.useEffect(() => setInner(value), [value]);

    React.useEffect(() => {
      const id = setTimeout(() => onValueChange(inner), delay);
      return () => clearTimeout(id);
    }, [inner, delay, onValueChange]);

    return (
      <input
        {...rest}
        ref={ref}
        value={inner}
        onChange={(e) => setInner(e.target.value)}
        className={rest.className}
      />
    );
  }
);

DebouncedInput.displayName = "DebouncedInput";

export default DebouncedInput;
