export function DetailRow({ label, children }: { label: string; children: string }) {
    return (
        <>
            <dt>{label}</dt>
            <dd dir="auto">{children}</dd>
        </>
    );
}
