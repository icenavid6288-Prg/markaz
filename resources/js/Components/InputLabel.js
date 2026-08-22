import { jsx as _jsx } from "react/jsx-runtime";
export default function InputLabel({ value, className = '', children, ...props }) {
    return (_jsx("label", { ...props, className: `block text-sm font-medium text-gray-700 dark:text-gray-300 ` +
            className, children: value ? value : children }));
}
