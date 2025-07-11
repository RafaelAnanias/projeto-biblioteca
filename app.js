"use strict";
// Classe principal da nossa aplicação de biblioteca.
class BibliotecaApp {
    constructor() {
        // Inicializa o acervo como um novo Map vazio.
        this.acervo = new Map();
        // Associa as propriedades da classe com os elementos do DOM.
        this.formCadastro = document.getElementById('form-cadastro');
        this.formBusca = document.getElementById('form-busca');
        this.listaLivrosDiv = document.getElementById('lista-livros');
        this.btnListarTodos = document.getElementById('btn-listar-todos');
        // Carrega os dados salvos no LocalStorage ao iniciar.
        this.carregarDoLocalStorage();
        // Configura os ouvintes de eventos para os formulários e botões.
        this.configurarEventos();
        // Exibe a lista de livros inicial.
        this.renderizarLista();
    }
    // Configura os eventos de submit para os formulários e click para os botões.
    configurarEventos() {
        this.formCadastro.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o recarregamento da página.
            this.adicionarLivro();
        });
        this.formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            this.buscarLivros();
        });
        this.btnListarTodos.addEventListener('click', () => {
            this.renderizarLista();
        });
    }
    // Adiciona um novo livro ao acervo.
    adicionarLivro() {
        // Pega os valores dos campos do formulário.
        const isbn = document.getElementById('isbn').value;
        const titulo = document.getElementById('titulo').value;
        const autor = document.getElementById('autor').value;
        const ano = parseInt(document.getElementById('ano').value);
        // Validação: verifica se o ISBN já existe no acervo.
        if (this.acervo.has(isbn)) {
            alert('Erro: Já existe um livro com este ISBN!');
            return;
        }
        // Cria o novo objeto livro.
        const novoLivro = { isbn, titulo, autor, ano, disponivel: true };
        // Adiciona o livro ao Map usando o método set(chave, valor).
        this.acervo.set(isbn, novoLivro);
        // Atualiza a exibição na tela, salva no LocalStorage e limpa o formulário.
        this.renderizarLista();
        this.salvarNoLocalStorage();
        this.formCadastro.reset();
    }
    // Busca livros no acervo com base no critério selecionado.
    buscarLivros() {
        const termo = document.getElementById('termo-busca').value.toLowerCase();
        const tipo = document.getElementById('tipo-busca').value;
        let resultados = [];
        // Estratégia de busca:
        if (tipo === 'id') {
            // Busca por ID (ISBN) é a mais eficiente com Map, usando o método get().
            // A complexidade é O(1) - tempo constante.
            const livro = this.acervo.get(termo);
            if (livro) {
                resultados.push(livro);
            }
        }
        else {
            // Para Título ou Autor, precisamos percorrer todos os valores do Map.
            // A complexidade é O(n) - tempo linear, onde n é o número de livros.
            const todosOsLivros = Array.from(this.acervo.values());
            if (tipo === 'titulo') {
                resultados = todosOsLivros.filter(livro => livro.titulo.toLowerCase().includes(termo));
            }
            else if (tipo === 'autor') {
                resultados = todosOsLivros.filter(livro => livro.autor.toLowerCase().includes(termo));
            }
        }
        // Renderiza apenas os resultados da busca.
        this.renderizarLista(resultados);
    }
    // Remove um livro do acervo usando o ISBN.
    removerLivro(isbn) {
        // O método delete() remove o elemento do Map pela chave.
        if (confirm(`Tem certeza que deseja remover o livro com ISBN ${isbn}?`)) {
            this.acervo.delete(isbn);
            this.renderizarLista();
            this.salvarNoLocalStorage();
        }
    }
    // Alterna o status de disponibilidade (emprestado/devolvido).
    alternarDisponibilidade(isbn) {
        const livro = this.acervo.get(isbn);
        if (livro) {
            livro.disponivel = !livro.disponivel; // Inverte o valor booleano.
            this.acervo.set(isbn, livro); // Atualiza o Map com o objeto modificado.
            this.renderizarLista();
            this.salvarNoLocalStorage();
        }
    }
    // Renderiza (desenha) a lista de livros no HTML.
    // Pode receber uma lista filtrada (para buscas) ou usar o acervo completo.
    renderizarLista(livros = Array.from(this.acervo.values())) {
        this.listaLivrosDiv.innerHTML = ''; // Limpa a lista atual.
        if (livros.length === 0) {
            this.listaLivrosDiv.innerHTML = '<p>Nenhum livro encontrado.</p>';
            return;
        }
        livros.forEach(livro => {
            const livroDiv = document.createElement('div');
            livroDiv.className = 'livro-item';
            if (!livro.disponivel) {
                livroDiv.classList.add('indisponivel');
            }
            const disponibilidadeTexto = livro.disponivel ? 'Disponível' : 'Emprestado';
            const toggleButtonTexto = livro.disponivel ? 'Emprestar' : 'Devolver';
            livroDiv.innerHTML = `
                <div class="livro-info">
                    <p><strong>ISBN:</strong> ${livro.isbn}</p>
                    <p><strong>Título:</strong> ${livro.titulo}</p>
                    <p><strong>Autor:</strong> ${livro.autor}</p>
                    <p><strong>Ano:</strong> ${livro.ano}</p>
                    <p><strong>Status:</strong> ${disponibilidadeTexto}</p>
                </div>
                <div class="livro-acoes">
                    <button class="btn-acao btn-toggle-disp">${toggleButtonTexto}</button>
                    <button class="btn-acao btn-remover">Remover</button>
                </div>
            `;
            // Adiciona os eventos aos botões criados dinamicamente.
            livroDiv.querySelector('.btn-remover').addEventListener('click', () => this.removerLivro(livro.isbn));
            livroDiv.querySelector('.btn-toggle-disp').addEventListener('click', () => this.alternarDisponibilidade(livro.isbn));
            this.listaLivrosDiv.appendChild(livroDiv);
        });
    }
    // Salva o estado atual do acervo no LocalStorage do navegador.
    salvarNoLocalStorage() {
        // LocalStorage só armazena strings. Convertemos o Map para um Array de [chave, valor]
        // e depois para uma string JSON.
        const acervoArray = Array.from(this.acervo.entries());
        localStorage.setItem('acervoBiblioteca', JSON.stringify(acervoArray));
    }
    // Carrega os dados do LocalStorage para o acervo.
    carregarDoLocalStorage() {
        const dadosSalvos = localStorage.getItem('acervoBiblioteca');
        if (dadosSalvos) {
            // Converte a string JSON de volta para um Array e, em seguida,
            // reconstrói o Map a partir desse array.
            const acervoArray = JSON.parse(dadosSalvos);
            this.acervo = new Map(acervoArray);
        }
    }
}
// Quando a página HTML estiver completamente carregada, cria uma instância da nossa aplicação.
document.addEventListener('DOMContentLoaded', () => {
    new BibliotecaApp();
});
