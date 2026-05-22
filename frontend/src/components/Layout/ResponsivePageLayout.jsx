import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/useAuth.js';

function ResponsivePageLayout({ children, showFooter = true }) {
  const { usuario } = useAuth();

  if (usuario) {
    return (
      <div className="flex min-h-screen bg-[#F5ECD7]">
        <Sidebar />
        <div className="flex-1 pb-24 md:ml-16 md:pb-0">{children}</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
      {showFooter ? <Footer /> : null}
    </>
  );
}

export default ResponsivePageLayout;
