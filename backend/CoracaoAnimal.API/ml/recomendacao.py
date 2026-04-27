from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# ── Encoder global ────────────────────────────────────
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')

# Treina o encoder com todos os valores possíveis
encoder.fit([
    ['cao',  'pequeno'],
    ['cao',  'medio'],
    ['cao',  'grande'],
    ['gato', 'pequeno'],
    ['gato', 'medio'],
    ['gato', 'grande'],
])

def vetorizar_animal(animal):
    """Converte animal em vetor numérico para cálculo de similaridade."""
    especie = animal.get('especie', 'cao')
    porte   = animal.get('porte',   'medio')
    idade   = animal.get('idade',   3) or 3

    # One-hot para espécie + porte
    categorico = encoder.transform([[especie, porte]])

    # Normaliza idade para escala 0-1 (máximo assumido: 15 anos)
    numerico = np.array([[min(idade, 15) / 15]])

    return np.hstack([categorico, numerico])

def vetorizar_perfil(perfil):
    """Converte perfil do adotante em vetor compatível com os animais."""
    especie_pref = perfil.get('especiePreferida', 'cao')
    espacio      = perfil.get('espacoDisponivel', 'medio')   # pequeno/medio/grande
    experiencia  = perfil.get('experiencia', 'nenhuma')       # nenhuma/alguma/muita

    # Mapeia espaço → porte preferido
    porte_map = { 'pequeno': 'pequeno', 'medio': 'medio', 'grande': 'grande' }
    porte_pref = porte_map.get(espacio, 'medio')

    # Mapeia experiência → idade preferida (sem experiência → animal mais jovem)
    idade_map = { 'nenhuma': 2, 'alguma': 4, 'muita': 7 }
    idade_pref = idade_map.get(experiencia, 3)

    categorico = encoder.transform([[especie_pref, porte_pref]])
    numerico   = np.array([[min(idade_pref, 15) / 15]])

    return np.hstack([categorico, numerico])

@app.route('/recomendar', methods=['POST'])
def recomendar():
    """
    Recebe perfil do adotante e lista de animais,
    retorna animais ordenados por compatibilidade.
    
    Body JSON:
    {
        "perfil": {
            "especiePreferida": "cao",
            "espacoDisponivel": "medio",
            "experiencia": "alguma"
        },
        "animais": [
            { "idAnimal": 1, "nome": "Rex", "especie": "cao", "porte": "medio", "idade": 3 },
            ...
        ]
    }
    """
    data    = request.get_json()
    perfil  = data.get('perfil', {})
    animais = data.get('animais', [])

    if not animais:
        return jsonify([])

    # Vetoriza o perfil do adotante
    vetor_perfil = vetorizar_perfil(perfil)

    # Vetoriza cada animal e calcula similaridade de cosseno
    resultados = []
    for animal in animais:
        vetor_animal = vetorizar_animal(animal)
        similaridade = cosine_similarity(vetor_perfil, vetor_animal)[0][0]
        resultados.append({
            **animal,
            'compatibilidade': round(float(similaridade) * 100, 1)
        })

    # Ordena por compatibilidade decrescente
    resultados.sort(key=lambda x: x['compatibilidade'], reverse=True)

    return jsonify(resultados)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'servico': 'ML Coração Animal' })

if __name__ == '__main__':
    app.run(port=5001, debug=True)