import { login } from './api/auth.service';
import { saveTokens } from './utils/auth';

function App() {
  const handleLogin = async () => {
    try {
      const data = await login('admin', 'admin');

      saveTokens(data.access_token, data.refresh_token);

      console.log('Tokens salvos com sucesso');
    } catch (error) {
      console.error('Erro no login', error);
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
