import type { ReactNode, RefObject } from "react";

type DropdownProps = {
    show: boolean;
    className?: string;
    children: ReactNode;
    ref?: RefObject<HTMLDivElement | null>;
}

export function Dropdown({ show, className, children, ref }: DropdownProps) {


    return (
        <div ref={ref} className={"bg-white p-2 " + className + (show ? " absolute" : " hidden")}>
            {children}
        </div>
    )
}