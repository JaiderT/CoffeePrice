import Footer from "../Layout/Footer";

function LayoutPublico({ children }) {
  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex-1">
        {children}
      </div>

      <Footer />

    </div>
  );
}

export default LayoutPublico;