from pynput import keyboard
from pynput.keyboard import Listener, Key
from textblob import TextBlob

arrayOfPhrases = []
palavras_chave = {
    "agressivo": ["raiva", "ódio", "explodir"],
    "burnout": ["cansado", "exausto", "esgotado"],
    "triste": ["triste", "deprimido", "sozinho"]
}

def classificar_comportamento(palavra):
    for comportamento, palavras in palavras_chave.items():
        if palavra in palavras:
            return comportamento
    return "Comportamento não identificado"

def classificar_sentimento(texto):
    blob = TextBlob(texto)
    sentimento = blob.sentiment.polarity
    if sentimento < -0.5:
        return "Agressivo"
    elif -0.5 <= sentimento < 0:
        return "Triste"
    elif sentimento > 0.5:
        return "Positivo"
    else:
        return "Neutro"

def on_press(key):
    try:
        # Captura teclas de caractere e adiciona à lista
        if key.char == ' ':
            frase_completa = ''.join(arrayOfPhrases)
            print(f"Frase capturada: {frase_completa}")
            
            # Classificação de comportamento
            for palavra in frase_completa.split():
                comportamento = classificar_comportamento(palavra)
                if comportamento != "Comportamento não identificado":
                    print(f"Comportamento identificado: {comportamento}")
            
            # Classificação de sentimento
            sentimento = classificar_sentimento(frase_completa)
            print(f"Sentimento identificado: {sentimento}")
            
            # Limpa a lista para capturar a próxima frase
            arrayOfPhrases.clear()
        else:
            #print(f'Key pressed: {key.char}')
            arrayOfPhrases.append(key.char)
    except AttributeError:
        # Captura teclas especiais como Esc, Shift, etc.
        print(f'Special key pressed: {key}')

    # Se a tecla de escape for pressionada, exibe as teclas capturadas e encerra
    if key == Key.esc:
        print("Encerrando o listener...")
        return False  # Encerra o listener

# Inicia o listener para capturar as teclas pressionadas
with Listener(on_press=on_press) as listener:
    listener.join()
