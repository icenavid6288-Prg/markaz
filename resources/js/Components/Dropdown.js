import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useState, } from 'react';
const DropDownContext = createContext({
    open: false,
    setOpen: () => { },
    toggleOpen: () => { },
});
const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };
    return (_jsx(DropDownContext.Provider, { value: { open, setOpen, toggleOpen }, children: _jsx("div", { className: "relative", children: children }) }));
};
const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen } = useContext(DropDownContext);
    return (_jsxs(_Fragment, { children: [_jsx("div", { onClick: toggleOpen, children: children }), open && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setOpen(false) }))] }));
};
const Content = ({ align = 'right', width = '48', contentClasses = 'py-1 bg-white dark:bg-gray-700', children, }) => {
    const { open, setOpen } = useContext(DropDownContext);
    let alignmentClasses = 'origin-top';
    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    }
    else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }
    let widthClasses = '';
    if (width === '48') {
        widthClasses = 'w-48';
    }
    return (_jsx(_Fragment, { children: _jsx(Transition, { show: open, enter: "transition ease-out duration-200", enterFrom: "opacity-0 scale-95", enterTo: "opacity-100 scale-100", leave: "transition ease-in duration-75", leaveFrom: "opacity-100 scale-100", leaveTo: "opacity-0 scale-95", children: _jsx("div", { className: `absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`, onClick: () => setOpen(false), children: _jsx("div", { className: `rounded-md ring-1 ring-black ring-opacity-5 ` +
                        contentClasses, children: children }) }) }) }));
};
const DropdownLink = ({ className = '', children, ...props }) => {
    return (_jsx(Link, { ...props, className: 'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ' +
            className, children: children }));
};
Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
export default Dropdown;
