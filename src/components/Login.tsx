import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../styles/Login.module.css";
import { login } from "../models/api";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Por favor, insira um email válido.");
      return;
    }

    try {
      const response = await login(email, password);
      if (response.success) {
        router.push("/dashboard");
      } else {
        setError("Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente mais tarde.");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>WELL BEING</h1>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Lembrar senha
        </label>
        <button type="submit">Entrar</button>
        <Link href="/register">Cadastra-se</Link>
      </form>
    </div>
  );
}