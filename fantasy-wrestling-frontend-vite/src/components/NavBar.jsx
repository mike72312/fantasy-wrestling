// import NavBar from './components/NavBar';

const App = () => {
  return (
    <Router>
      {/* <NavBar /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        ...
      </Routes>
    </Router>
  );
};
export default NavBar;