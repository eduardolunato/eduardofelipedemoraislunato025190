import { login } from './api/auth.service';

function App() {
  const handleLogin = async () => {
    try {
      const data = await login('admin', 'admin');
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Tailwind funcionando 🚀</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Testar Login
      </button>
    </div>
  );
}

export default App;
