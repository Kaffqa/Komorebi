import { Link } from "react-router";
import { cn } from "../../utils/cn";

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className, 
  as: Component = "button", 
  to,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-komorebi-sage focus:ring-offset-2";
  
  const variants = {
    primary: "bg-komorebi-green text-white hover:bg-komorebi-green-light shadow-sm",
    secondary: "bg-white text-komorebi-green border border-komorebi-sage/30 hover:bg-komorebi-light",
    ghost: "text-komorebi-green hover:bg-komorebi-light",
    outline: "border-2 border-komorebi-green text-komorebi-green hover:bg-komorebi-green hover:text-white"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg"
  };

  const classes = cn(baseStyles, variants[variant], sizes[size], className);

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
