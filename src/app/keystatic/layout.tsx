export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            backgroundColor: '#ffffff',
            height: '100vh',
            overflowY: 'auto',
            color: '#000000'
        }}>
            {children}
        </div>
    );
}
