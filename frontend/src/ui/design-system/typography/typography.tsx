interface Props {
    variant?: "display" | "h1" | "h2" | "h3" | "h4" | "h5"| "lead" | "body-lg" | "body-base" | "body-sm" | "caption1" | "caption2";
    children : React.ReactNode;
}
export const Typography = ({variant , children } : Props )=>{
    return (
        <>children</>
    )
}