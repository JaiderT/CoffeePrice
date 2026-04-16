import Footer from './Footer';
import Kaffi from '../kaffi';

function LayoutPublico({ children }) {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="grow">
        {children}
      </main>

      <Footer />
      <Kaffi />
    </div>
  );
}

export default LayoutPublico;