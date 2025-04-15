import { useState, FormEvent } from "react";
import styles from "../styles/Login.module.css";

export default function Report() {
  const [report, setReport] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ report });
    // backend aqui
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>Parecer do Psicólogo</h1>
        <textarea
          placeholder="Digite seu parecer sobre o paciente..."
          value={report}
          onChange={(e) => setReport(e.target.value)}
          rows={5}
          required
        />
        <button type="submit">Enviar Parecer</button>
      </form>
    </div>
  );
}