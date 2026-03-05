export default function Layout({ children }) {
  return (
    <div className="max-w-md mx-auto min-h-screen">
      <style>{`
        body { background: linear-gradient(160deg, #D52B1E 0%, #8a1a10 25%, #1a1a00 45%, #003318 70%, #007A3D 85%, #c9a800 100%); min-height: 100vh; }
        * { -webkit-tap-highlight-color: transparent; }
        input { -webkit-user-select: text; user-select: text; }
      `}</style>
      {children}
    </div>
  );
}