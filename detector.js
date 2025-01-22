// Constantes pour l'analyse
const COMMON_TRANSITIONS = [
    'premièrement', 'deuxièmement', 'ensuite', 'puis', 'enfin',
    'cependant', 'néanmoins', 'toutefois', 'mais', 'or',
    'donc', 'ainsi', 'par conséquent', 'en effet', 'car',
    'de plus', 'en outre', 'également', 'aussi', 'par ailleurs'
];

// Initialisation des graphiques
let charts = {
    vocabularyDiversity: null,
    sentenceStructure: null,
    commonWords: null
};

class TextAnalyzer {
    constructor() {
        this.cache = new Map();
        this.currentText = '';
        this.metrics = this.getEmptyMetrics();
    }

    getEmptyMetrics() {
        return {
            vocabularyStats: {
                uniqueWords: 0,
                totalWords: 0,
                avgWordLength: 0,
                commonWords: []
            },
            sentenceStats: {
                lengths: [],
                types: {
                    simple: 0,
                    compound: 0,
                    complex: 0
                },
                transitions: []
            }
        };
    }

    async analyzeText(text) {
        this.currentText = text;
        
        if (!text.trim()) {
            return {
                aiScore: 0,
                details: "Veuillez entrer du texte à analyser.",
                metrics: this.getEmptyMetrics()
            };
        }

        this.metrics = this.getEmptyMetrics();
        const [aiScore, aiMarkers] = this.analyzeAIContent(text);
        
        // Mise à jour des graphiques
        this.updateCharts();
        
        return {
            aiScore,
            details: this.formatDetailsBase(aiMarkers),
            metrics: this.metrics
        };
    }

    analyzeAIContent(text) {
        let score = 0;
        let aiMarkers = [];
        const words = text.toLowerCase().split(/\s+/);
        
        // Analyse du vocabulaire
        this.metrics.vocabularyStats = this.analyzeVocabularyStats(text);
        
        // Analyse des phrases
        this.metrics.sentenceStats = this.analyzeSentenceStructure(text);
        
        // Analyse approfondie
        const analysis = this.performDetailedAnalysis(text);
        aiMarkers = [...aiMarkers, ...analysis.markers];
        score += analysis.score;

        return [score, aiMarkers];
    }

    performDetailedAnalysis(text) {
        const markers = [];
        let score = 0;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.toLowerCase().split(/\s+/);
        
        // Analyse de la longueur des phrases
        const avgSentenceLength = words.length / sentences.length;
        if (avgSentenceLength > 25) {
            markers.push({
                type: 'structure',
                message: 'Les phrases sont très longues (moyenne > 25 mots). Considérez les raccourcir pour améliorer la lisibilité.',
                severity: 'high'
            });
            score += 15;
        }

        // Analyse de la répétition des mots
        const wordFrequency = {};
        words.forEach(word => {
            if (word.length > 3) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });
        
        const repeatedWords = Object.entries(wordFrequency)
            .filter(([_, count]) => count > 3)
            .map(([word, count]) => ({ word, count }));
        
        if (repeatedWords.length > 0) {
            markers.push({
                type: 'vocabulary',
                message: `Mots fréquemment répétés : ${repeatedWords.slice(0, 5).map(w => `"${w.word}" (${w.count} fois)`).join(', ')}`,
                severity: 'medium'
            });
        }

        // Analyse des transitions
        const transitionCount = this.metrics.sentenceStats.transitions.length;
        if (transitionCount < sentences.length / 4) {
            markers.push({
                type: 'coherence',
                message: 'Manque de mots de transition. Ajoutez des connecteurs logiques pour améliorer la fluidité.',
                severity: 'medium'
            });
            score += 10;
        }

        // Analyse de la variété des structures
        const { simple, compound, complex } = this.metrics.sentenceStats.types;
        const total = simple + compound + complex;
        if (simple / total > 0.7) {
            markers.push({
                type: 'structure',
                message: 'Structure des phrases trop simple. Variez les constructions pour un style plus engageant.',
                severity: 'medium'
            });
            score += 10;
        }

        // Analyse du vocabulaire
        const { uniqueWords, totalWords } = this.metrics.vocabularyStats;
        const diversityRatio = uniqueWords / totalWords;
        if (diversityRatio < 0.4) {
            markers.push({
                type: 'vocabulary',
                message: `Vocabulaire peu varié (${Math.round(diversityRatio * 100)}% de mots uniques). Enrichissez votre lexique.`,
                severity: 'high'
            });
            score += 20;
        }

        return { markers, score };
    }

    analyzeSentenceStructure(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const stats = {
            lengths: sentences.map(s => s.split(/\s+/).length),
            types: {
                simple: 0,
                compound: 0,
                complex: 0
            },
            transitions: this.findTransitions(text)
        };

        sentences.forEach(sentence => {
            if (sentence.includes(',') && (sentence.includes('qui') || sentence.includes('que'))) {
                stats.types.complex++;
            } else if (sentence.includes(',') || sentence.includes('et') || sentence.includes('ou')) {
                stats.types.compound++;
            } else {
                stats.types.simple++;
            }
        });

        return stats;
    }

    analyzeVocabularyStats(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const wordLengths = words.map(w => w.length);
        
        return {
            uniqueWords: uniqueWords.size,
            totalWords: words.length,
            avgWordLength: wordLengths.reduce((a, b) => a + b, 0) / words.length || 0,
            commonWords: this.getMostCommonWords(words, 20)
        };
    }

    getMostCommonWords(words, limit) {
        const frequency = {};
        words.forEach(word => {
            if (word.length > 3) {
                const wordLower = word.toLowerCase();
                frequency[wordLower] = (frequency[wordLower] || 0) + 1;
            }
        });
        
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
    }

    findTransitions(text) {
        return COMMON_TRANSITIONS.filter(transition => 
            text.toLowerCase().includes(transition.toLowerCase())
        );
    }

    formatDetailsBase(aiMarkers) {
        const severityColors = {
            high: "#ff4444",
            medium: "#ffaa00",
            low: "#44aa44"
        };

        let details = "<h4>Analyse détaillée du contenu :</h4>";
        
        // Statistiques générales
        details += `<h5>Statistiques Générales</h5>
        <ul>
            <li>Nombre total de mots : ${this.metrics.vocabularyStats.totalWords}</li>
            <li>Nombre de mots uniques : ${this.metrics.vocabularyStats.uniqueWords}</li>
            <li>Longueur moyenne des mots : ${this.metrics.vocabularyStats.avgWordLength.toFixed(1)} caractères</li>
            <li>Nombre de phrases : ${this.metrics.sentenceStats.lengths.length}</li>
            <li>Longueur moyenne des phrases : ${(this.metrics.vocabularyStats.totalWords / this.metrics.sentenceStats.lengths.length).toFixed(1)} mots</li>
        </ul>`;

        // Structure des phrases
        const { simple, compound, complex } = this.metrics.sentenceStats.types;
        const total = simple + compound + complex;
        details += `<h5>Structure des Phrases</h5>
        <ul>
            <li>Phrases simples : ${Math.round((simple/total)*100)}%</li>
            <li>Phrases composées : ${Math.round((compound/total)*100)}%</li>
            <li>Phrases complexes : ${Math.round((complex/total)*100)}%</li>
        </ul>`;

        // Transitions et connecteurs logiques
        details += `<h5>Cohérence et Transitions</h5>
        <ul>
            <li>Nombre de connecteurs logiques : ${this.metrics.sentenceStats.transitions.length}</li>
            <li>Connecteurs utilisés : ${this.metrics.sentenceStats.transitions.join(', ') || 'Aucun'}</li>
        </ul>`;

        // Problèmes détectés
        if (aiMarkers.length > 0) {
            details += "<h5>Points d'Attention</h5><ul>";
            aiMarkers.forEach(marker => {
                details += `<li style="color: ${severityColors[marker.severity]}">${marker.message}</li>`;
            });
            details += "</ul>";
        }

        return details;
    }

    updateCharts() {
        this.updateVocabularyDiversityChart();
        this.updateSentenceStructureChart();
        this.updateCommonWordsChart();
    }

    updateVocabularyDiversityChart() {
        const ctx = document.getElementById('vocabularyDiversityChart');
        if (!ctx) return;
        
        if (charts.vocabularyDiversity) {
            charts.vocabularyDiversity.destroy();
        }

        const { uniqueWords, totalWords } = this.metrics.vocabularyStats;
        const diversityRatio = (uniqueWords / totalWords) * 100;

        charts.vocabularyDiversity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Mots uniques', 'Répétitions'],
                datasets: [{
                    data: [diversityRatio, 100 - diversityRatio],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.6)',
                        'rgba(231, 76, 60, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateSentenceStructureChart() {
        const ctx = document.getElementById('sentenceStructureChart');
        if (!ctx) return;
        
        if (charts.sentenceStructure) {
            charts.sentenceStructure.destroy();
        }

        const { simple, compound, complex } = this.metrics.sentenceStats.types;
        const total = simple + compound + complex;

        charts.sentenceStructure = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Phrases Simples', 'Phrases Composées', 'Phrases Complexes'],
                datasets: [{
                    data: [
                        (simple / total) * 100,
                        (compound / total) * 100,
                        (complex / total) * 100
                    ],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.6)',
                        'rgba(155, 89, 182, 0.6)',
                        'rgba(230, 126, 34, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateCommonWordsChart() {
        const ctx = document.getElementById('commonWordsChart');
        if (!ctx) return;
        
        if (charts.commonWords) {
            charts.commonWords.destroy();
        }

        const commonWords = this.metrics.vocabularyStats.commonWords.slice(0, 10);
        
        charts.commonWords = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: commonWords.map(w => w.word),
                datasets: [{
                    label: 'Fréquence',
                    data: commonWords.map(w => w.count),
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Fonctions de l'interface utilisateur
window.analyzeText = async function() {
    const textInput = document.getElementById('textInput').value;
    const analyzer = new TextAnalyzer();
    const results = await analyzer.analyzeText(textInput);

    document.getElementById('aiScore').textContent = `${results.aiScore}%`;
    document.getElementById('detailedAnalysis').innerHTML = results.details;
};

window.clearText = function() {
    document.getElementById('textInput').value = '';
    document.getElementById('aiScore').textContent = '-';
    document.getElementById('detailedAnalysis').innerHTML = '';
    
    // Réinitialiser les graphiques
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
};