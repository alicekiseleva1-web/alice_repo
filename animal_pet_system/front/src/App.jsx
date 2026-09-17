//содержимое главной страницы, интерфейс приложения
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedReportStatus, setSelectedReportStatus] = useState('idle')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [registrationData, setRegistrationData] = useState({
    first_name: '',
    last_name: '',
    city_id: null,
    phone: '',
    email: '',
  password: '',
  })

  const [registrationStatus, setRegistrationStatus] = useState('idle')
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  const [loginStatus, setLoginStatus] = useState('idle')
  const [loginMessage, setLoginMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState([])
  const [citySearchStatus, setCitySearchStatus] = useState('idle')
  const [citySearchMessage, setCitySearchMessage] = useState('')

  useEffect(() => {
    const query = cityQuery.trim()

    if (query.length < 3 || registrationData.city_id) {
      return undefined
    }

    const controller = new AbortController()

    const timeoutId = window.setTimeout(async () => {
      try {
        setCitySearchStatus('loading')
        setCitySearchMessage('')

        const response = await fetch(`${API_URL}/cities/suggest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.detail || 'Не удалось найти города')
        }

        setCitySuggestions(data)
        setCitySearchStatus('success')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCitySearchStatus('error')
          setCitySearchMessage(error.message)
        }
      }
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [cityQuery, registrationData.city_id])

  async function loadReports(type = selectedType) {
    try {
      setStatus('loading')
      setError('')

      const query = type ? `?report_type_id=${type}` : ''
      const response = await fetch(`${API_URL}/report_list${query}`)

      if (!response.ok) {
        throw new Error('Не удалось загрузить объявления')
      }

      const data = await response.json()

      setReports(data)
      setStatus('success')
    } catch (error) {
      setError(error.message)
      setStatus('error')
    }
  }
  async function loadReportDetails(reportId) {
  try {
    setSelectedReportStatus('loading')
    setIsModalOpen(true)

    const response = await fetch(`${API_URL}/report/${reportId}`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить объявление')
    }

    const data = await response.json()
    setSelectedReport(data)
    setSelectedReportStatus('success')
  } catch (error) {
    setError(error.message)
    setSelectedReportStatus('error')
  }
}
async function registerUser(event) {
  event.preventDefault()

  if (!registrationData.city_id) {
    setRegistrationStatus('error')
    setRegistrationMessage('Выбери город из подсказок')
    return
  }

  try {
    setRegistrationStatus('loading')
    setRegistrationMessage('')

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Не удалось зарегистрироваться')
    }

    setRegistrationStatus('success')
    setRegistrationMessage(`Регистрация успешна. Ваш ID: ${data.user_id}`)
    setCurrentUserId(data.user_id)
    setIsAuthModalOpen(false)

    setRegistrationData({
      first_name: '',
      last_name: '',
      city_id: null,
      phone: '',
      email: '',
      password: '',
    })
    setCityQuery('')
    setCitySuggestions([])
  } catch (error) {
    setRegistrationStatus('error')
    setRegistrationMessage(error.message)
  }
}
async function loginUser(event) {
  event.preventDefault()

  try {
    setLoginStatus('loading')
    setLoginMessage('')

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Не удалось войти')
    }

    setCurrentUserId(data.user_id)
    setLoginStatus('success')
    setLoginMessage('Вход выполнен')
    setIsAuthModalOpen(false)
  } catch (error) {
    setLoginStatus('error')
    setLoginMessage(error.message)
  }
}

async function selectCity(suggestion) {
  try {
    setCitySearchStatus('resolving')
    setCitySearchMessage('')

    const response = await fetch(`${API_URL}/cities/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city_name: suggestion.city_name,
        city_fias_id: suggestion.city_fias_id,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Не удалось выбрать город')
    }

    setRegistrationData((currentData) => ({
      ...currentData,
      city_id: data.city_id,
    }))
    setCityQuery(data.city_name)
    setCitySuggestions([])
    setCitySearchStatus('selected')
  } catch (error) {
    setCitySearchStatus('error')
    setCitySearchMessage(error.message)
  }
}

function changeCityQuery(event) {
  const query = event.target.value

  setCityQuery(query)
  setRegistrationData((currentData) => ({
    ...currentData,
    city_id: null,
  }))
  setCitySearchMessage('')

  if (query.trim().length < 3) {
    setCitySuggestions([])
    setCitySearchStatus('idle')
  }
}

function logoutUser() {
  setCurrentUserId(null)
  setLoginData({
    email: '',
    password: '',
  })
}
  return (
    <div className="app">
      <header className="header">
        <a className="logo" href="/">
          Найди друга
        </a>

        <nav className="navigation">
          <a href="#reports">Объявления</a>
          <a href="#animals">Животные</a>
          <a href="#help">Помощь приютам</a>
        </nav>
        {currentUserId ? (
          <button
            className="auth-button"
            type="button"
            onClick={logoutUser}
          >
            Выйти
          </button>
        ) : (
          <button
            className="auth-button"
            type="button"
            onClick={() => {
              setAuthMode('login')
              setIsAuthModalOpen(true)
            }}
          >
            Войти
          </button>
        )}
      </header>

      <main>
        <section className="hero-section">
          <p className="eyebrow">Сервис поиска и помощи животным</p>
          <h1>Помогаем животным найти дорогу домой</h1>
          <p className="hero-text">
            Просматривайте объявления, помогайте приютам и делитесь важной
            информацией.
          </p>

        <button
            type="button"
            onClick={() => loadReports()}
            disabled={status === 'loading'}
        >
        {status === 'loading' ? 'Загружаем...' : 'Посмотреть объявления'}
        </button>
        </section>


      <section id="reports">
        {status === 'error' && <p>{error}</p>}

        {status === 'success' && (
          <div className="reports-content">
            <h2>Открытые объявления</h2>

            <div className="report-filters">
              <button
                type="button"
                className={selectedType === null ? 'active-filter' : ''}
                onClick={() => {
                  setSelectedType(null)
                  loadReports(null)
                }}
              >
                Все
              </button>

              <button
                type="button"
                className={selectedType === 1 ? 'active-filter' : ''}
                onClick={() => {
                  setSelectedType(1)
                  loadReports(1)
                }}
              >
                Пропали
              </button>

              <button
                type="button"
                className={selectedType === 2 ? 'active-filter' : ''}
                onClick={() => {
                  setSelectedType(2)
                  loadReports(2)
                }}
              >
                Найдены
              </button>
            </div>

            <div className="reports-grid">
              {/* если нет объявлений по фильтру */}
              {reports.length === 0 && (
                <p className="empty-reports">
                  По этому фильтру пока нет открытых объявлений.
                </p>
              )}

              {reports.map((report) => (
                <article
                  key={report.report_id}
                  onClick={() => loadReportDetails(report.report_id)}
                >
                  <p className="report-type">
                    {report.report_type_id === 1
                      ? 'Пропало животное'
                      : 'Найдено животное'}
                  </p>
                  <h3>{report.title}</h3>
                  <p>{report.description}</p>
                  <p>{report.location}</p>
                  <p>Животное: {report.animal_name}</p>
                </article>
              ))}
            </div>
          </div>
        )}
{isModalOpen && (
  <div
    className="modal-overlay"
    onClick={() => setIsModalOpen(false)}
  >
    <section
      className="report-modal"
      role="dialog"
      aria-modal="true"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="modal-close-button"
        type="button"
        onClick={() => setIsModalOpen(false)}
      >
        ×
      </button>

      {selectedReportStatus === 'loading' && (
        <p>Загружаем подробности объявления...</p>
      )}

      {selectedReportStatus === 'error' && <p>{error}</p>}

      {selectedReportStatus === 'success' && selectedReport && (
        <div>
          <h2>{selectedReport.report_title}</h2>
          <p>{selectedReport.report_description}</p>
          <p>Город: {selectedReport.city_id}</p>

          <h3>Животное</h3>
          <p>Кличка: {selectedReport.animal_name}</p>
          <p>Порода: {selectedReport.breed}</p>
          <p>Возраст: {selectedReport.age}</p>
          <p>Окрас: {selectedReport.color}</p>

          <h3>Автор объявления</h3>
          <p>{selectedReport.user_name}</p>
          <p>{selectedReport.phone}</p>
        </div>
      )}
    </section>
  </div>
)}
      </section>
    </main>

      {isAuthModalOpen && (
        <div
          className="auth-modal-overlay"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Авторизация"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close-button"
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              aria-label="Закрыть окно"
            >
              ×
            </button>

            <div className="auth-tabs">
              <button
                className={authMode === 'login' ? 'active-auth-tab' : ''}
                type="button"
                onClick={() => setAuthMode('login')}
              >
                Войти
              </button>
              <button
                className={authMode === 'register' ? 'active-auth-tab' : ''}
                type="button"
                onClick={() => setAuthMode('register')}
              >
                Регистрация
              </button>
            </div>

            {authMode === 'login' ? (
              <form className="login-form" onSubmit={loginUser}>
                <h2>С возвращением</h2>
                <p>Войди, чтобы продолжить работу с сервисом.</p>

                <label>
                  Email
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(event) =>
                      setLoginData({
                        ...loginData,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Пароль
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(event) =>
                      setLoginData({
                        ...loginData,
                        password: event.target.value,
                      })
                    }
                    minLength="8"
                    required
                  />
                </label>

                <button type="submit" disabled={loginStatus === 'loading'}>
                  {loginStatus === 'loading' ? 'Входим...' : 'Войти'}
                </button>

                {loginMessage && (
                  <p className={`auth-message ${loginStatus}`}>
                    {loginMessage}
                  </p>
                )}

                <p className="auth-switch">
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                  >
                    Зарегистрироваться
                  </button>
                </p>
              </form>
            ) : (
              <form className="registration-form" onSubmit={registerUser}>
                <h2>Регистрация</h2>

                <label>
                  Имя
                  <input
                    type="text"
                    value={registrationData.first_name}
                    onChange={(event) =>
                      setRegistrationData({
                        ...registrationData,
                        first_name: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Фамилия
                  <input
                    type="text"
                    value={registrationData.last_name}
                    onChange={(event) =>
                      setRegistrationData({
                        ...registrationData,
                        last_name: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label className="city-field">
                  Город
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={changeCityQuery}
                    placeholder="Начни вводить город"
                    autoComplete="off"
                    required
                  />
                </label>

                {citySearchStatus === 'loading' && (
                  <p className="city-search-status">Ищем города...</p>
                )}

                {citySuggestions.length > 0 && (
                  <ul className="city-suggestions">
                    {citySuggestions.map((suggestion) => (
                      <li key={suggestion.city_fias_id}>
                        <button
                          type="button"
                          onClick={() => selectCity(suggestion)}
                        >
                          {suggestion.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {citySearchStatus === 'selected' && (
                  <p className="city-search-status success">
                    Город выбран
                  </p>
                )}

                {citySearchMessage && (
                  <p className="city-search-status error">
                    {citySearchMessage}
                  </p>
                )}

                <label>
                  Телефон
                  <input
                    type="tel"
                    value={registrationData.phone}
                    onChange={(event) =>
                      setRegistrationData({
                        ...registrationData,
                        phone: event.target.value,
                      })
                    }
                    placeholder="+79990000000"
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={registrationData.email}
                    onChange={(event) =>
                      setRegistrationData({
                        ...registrationData,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Пароль
                  <input
                    type="password"
                    value={registrationData.password}
                    onChange={(event) =>
                      setRegistrationData({
                        ...registrationData,
                        password: event.target.value,
                      })
                    }
                    minLength="8"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={registrationStatus === 'loading'}
                >
                  {registrationStatus === 'loading'
                    ? 'Регистрируем...'
                    : 'Зарегистрироваться'}
                </button>

                {registrationMessage && (
                  <p className={`auth-message ${registrationStatus}`}>
                    {registrationMessage}
                  </p>
                )}

                <p className="auth-switch">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                  >
                    Войти
                  </button>
                </p>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
