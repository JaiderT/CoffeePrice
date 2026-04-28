import Footer from './Footer';
import Kaffi from '../kaffi';
import Navbar from './Navbar';

function LayoutPublico({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow">
        {children}
      </main>
      <Footer />
      <Kaffi />
    </div>
  );
}

export default LayoutPublico;
