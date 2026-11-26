import { useState } from 'react'
import { dadosClima } from './dadosClima'
import { codigosWmo } from './codigosWmo'
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Sunrise
} from 'lucide-react'
import './App.css'

function App() {
  const [busca, setBusca] = useState('')
  const [cidade, setCidade] = useState(null)
  const [previsao, setPrevisao] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function obterClima(codigo) {
    return codigosWmo.find(item => item.codigo === Number(codigo)) || {
      codigo,
      descricao: 'Condição não disponível',
      icone: '🌤️'
    }
  }

  async function buscar(nomeCidade = busca) {
    const termo = nomeCidade.trim()

    if (!termo) {
      setErro('Digite ou escolha uma cidade para pesquisar.')
      return
    }

    const resultado = dadosClima.find(
      item => item.name.toLowerCase() === termo.toLowerCase()
    )

    if (!resultado) {
      setCidade(null)
      setPrevisao(null)
      setCarregando(false)
      setErro('Cidade não encontrada. Escolha uma das cidades disponíveis.')
      return
    }

    setBusca(resultado.name)
    setCidade(resultado)
    setPrevisao(null)
    setErro('')
    setCarregando(true)

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${resultado.latitude}&longitude=${resultado.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=sunrise,sunset,uv_index_max,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10&timezone=auto`
      const resposta = await fetch(url)

      if (!resposta.ok) {
        throw new Error('Não foi possível consultar a previsão.')
      }

      const dados = await resposta.json()

      if (!dados.daily || !dados.current) {
        throw new Error('A API não retornou os dados do clima.')
      }

      setCidade({
        ...resultado,
        current: {
          ...dados.current,
          sunrise: dados.daily.sunrise?.[0]?.slice(11, 16) || '--:--',
          sunset: dados.daily.sunset?.[0]?.slice(11, 16) || '--:--',
          uv_index: dados.daily.uv_index_max?.[0] ?? '--'
        }
      })
      setPrevisao(dados.daily)
    } catch (erroBusca) {
      console.error('Erro ao buscar previsão:', erroBusca)
      setErro('Não foi possível carregar a previsão. Confira sua conexão e tente novamente.')
      setPrevisao(null)
    } finally {
      setCarregando(false)
    }
  }

  const climaAtual = cidade ? obterClima(cidade.current.weather_code) : null

  return (
    <main className="app">
      <header className="primeira">
        <img className="logo" src="/imgs/logo.png" alt="Logo Sol Chuva" />
        <div className="coluna">
          <h1>Sol Chuva</h1>
          <p>O tempo certo, onde você estiver.</p>
        </div>
      </header>

      <div className="busca">
        <input
          value={busca}
          onChange={evento => setBusca(evento.target.value)}
          onKeyDown={evento => evento.key === 'Enter' && buscar()}
          placeholder="Digite o nome de uma cidade..."
          aria-label="Nome da cidade"
        />
        <button onClick={() => buscar()} disabled={carregando}>
          {carregando ? 'Buscando...' : '⌕ Buscar'}
        </button>
      </div>

      <div className="cidades">
        {dadosClima.map(item => (
          <button
            className="cidade-sugerida"
            key={item.id}
            onClick={() => buscar(item.name)}
            type="button"
          >
            {item.name}
          </button>
        ))}
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {cidade && climaAtual && (
        <section className="card-container" aria-label={`Clima em ${cidade.name}`}>
          <article className="card">
            <div className="card-cabecalho">
              <div>
                <h2 className="card-title">{cidade.name}</h2>
                <p className="local-cidade">{cidade.admin1} — {cidade.country}</p>
              </div>
              <span className="atualizado">Atualizado às {cidade.current.time?.slice(11, 16) || '--:--'}</span>
            </div>

            <div className="clima-resumo">
              <div className="clima-principal">
                <div className="clima-icone">{climaAtual.icone}</div>
                <div className="clima-temperatura">
                  <h1>{Math.round(cidade.current.temperature_2m)}°C</h1>
                  <p>{climaAtual.descricao}</p>
                </div>
              </div>

              <div className="detalhes-clima">
                <div className="detalhe-card">
                  <div className="detalhe-info">
                    <Thermometer color="#ff7043" size={19} />
                    <span>Sensação</span>
                  </div>
                  <strong>{Math.round(cidade.current.apparent_temperature)}°C</strong>
                </div>

                <div className="detalhe-card">
                  <div className="detalhe-info">
                    <Droplets color="#318bff" size={19} />
                    <span>Umidade</span>
                  </div>
                  <strong>{cidade.current.relative_humidity_2m}%</strong>
                </div>

                <div className="detalhe-card">
                  <div className="detalhe-info">
                    <Wind color="#42c9b7" size={19} />
                    <span>Vento</span>
                  </div>
                  <strong>{cidade.current.wind_speed_10m} km/h</strong>
                </div>

                <div className="detalhe-card">
                  <div className="detalhe-info">
                    <Droplets color="#318bff" size={19} />
                    <span>Precipitação</span>
                  </div>
                  <strong>{cidade.current.precipitation} mm</strong>
                </div>

                <div className="detalhe-card">
                  <div className="detalhe-info">
                    <Sun color="#ffb52e" size={19} />
                    <span>Índice UV</span>
                  </div>
                  <strong>{cidade.current.uv_index}</strong>
                </div>

                <div className="detalhe-card">
                  <div className="detalhe-info">
                    <Sunrise color="#ffb52e" size={19} />
                    <span>Nascer / Pôr do sol</span>
                  </div>
                  <strong>{cidade.current.sunrise} / {cidade.current.sunset}</strong>
                </div>
              </div>
            </div>

            {carregando && <p className="carregando">Carregando previsão...</p>}

            {previsao && (
              <section className="previsao-container">
                <h2>Previsão para os próximos 10 dias</h2>
                <div className="previsao-lista">
                  {previsao.time.map((dia, index) => {
                    const climaDia = obterClima(previsao.weather_code[index])
                    const dataFormatada = new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit'
                    })

                    return (
                      <div className="previsao-card" key={dia}>
                        <p className="previsao-data">{dataFormatada}</p>
                        <span className="previsao-icone">{climaDia.icone}</span>
                        <small className="previsao-descricao">{climaDia.descricao}</small>
                        <div className="previsao-temperaturas">
                          <strong>{Math.round(previsao.temperature_2m_max[index])}°</strong>
                          <span>{Math.round(previsao.temperature_2m_min[index])}°</span>
                        </div>
                        <small className="previsao-chuva">☔ {previsao.precipitation_probability_max[index] ?? 0}%</small>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </article>
        </section>
      )}
    </main>
  )
}

export default App
