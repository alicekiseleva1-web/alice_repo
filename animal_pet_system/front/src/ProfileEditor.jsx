import { useEffect, useState } from 'react'
import './ProfileEditor.css'
import AnimalPhotos from './AnimalPhotos'

async function requestJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join('; ')
      : data.detail
    throw new Error(detail || data.error || 'Не удалось выполнить запрос')
  }
  return data
}

function jsonOptions(method, data, signal) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal }
}

function EditForm({ title, children, save, onSaved, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = await save()
      onSaved(data.message)
    } catch (error) {
      setError(error instanceof TypeError ? 'Нет связи с сервером. Изменения не подтверждены — повторите попытку.' : error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="profile-edit-form" onSubmit={submit}>
      <h4>{title}</h4>
      <fieldset disabled={busy}>
        {children}
        <div className="profile-edit-actions">
          <button className="report-status-button" type="submit">{busy ? 'Сохраняем…' : 'Сохранить'}</button>
          <button className="shelter-cancel-button" type="button" onClick={onCancel}>Отмена</button>
        </div>
      </fieldset>
      {error && <p className="profile-edit-error" role="alert">{error}</p>}
    </form>
  )
}

function CityPicker({ apiUrl, city, onChange }) {
  const [query, setQuery] = useState(city?.label || '')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (city || query.trim().length < 3) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setMessage('Ищем города…')
      try {
        const data = await requestJson(apiUrl + '/cities/suggest', jsonOptions('POST', { query: query.trim() }, controller.signal))
        if (controller.signal.aborted) return
        setSuggestions(data)
        setMessage(data.length ? '' : 'Город не найден. Уточните название.')
      } catch {
        if (!controller.signal.aborted) setMessage('Не удалось получить подсказки городов.')
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [apiUrl, city, query])

  return (
    <div className="profile-edit-city">
      <label>Город
        <input value={query} maxLength={100} autoComplete="off" required
          onChange={(event) => {
            setQuery(event.target.value)
            onChange(null)
            setSuggestions([])
            setMessage('')
          }} />
      </label>
      {!city && <small>Введите минимум три буквы и выберите город из подсказок.</small>}
      {message && <p role="status">{message}</p>}
      {suggestions.length > 0 && (
        <ul className="city-suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.city_fias_id}>
              <button type="button" onClick={() => {
                setQuery(suggestion.label)
                onChange(suggestion)
                setSuggestions([])
                setMessage('')
              }}>{suggestion.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AnimalEditor({ animal, userId, apiUrl, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: animal.name ?? '', breed: animal.breed ?? '',
    gender_id: animal.gender_id ?? '', age: animal.age ?? '',
    color: animal.color ?? '', description: animal.description ?? '',
  })
  const [city, setCity] = useState(animal.city_id
    ? { city_id: animal.city_id, label: animal.city_name || '' }
    : null)
  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function save() {
    if (!city) throw new Error('Выберите город из подсказок')
    let cityId = city.city_id
    if (!cityId) {
      const resolved = await requestJson(apiUrl + '/cities/resolve', jsonOptions('POST', {
        city_name: city.city_name, city_fias_id: city.city_fias_id,
      }))
      cityId = resolved.city_id
    }
    return requestJson(apiUrl + '/animals/' + animal.animal_id, jsonOptions('PATCH', {
      user_id: userId, name: form.name.trim(), breed: form.breed.trim(),
      gender_id: form.gender_id === '' ? null : Number(form.gender_id),
      age: form.age === '' ? null : Number(form.age),
      color: form.color.trim(), city_id: cityId,
      description: form.description.trim(),
    }))
  }

  return (
    <EditForm title="Редактирование животного" save={save} onSaved={onSaved} onCancel={onCancel}>
      <p className="profile-edit-note">Изменения будут видны во всех объявлениях этого животного. Фотографии останутся прежними.</p>
      <label>Кличка<input name="name" value={form.name} onChange={change} required maxLength={100} /></label>
      <label>Порода<input name="breed" value={form.breed} onChange={change} required maxLength={100} /></label>
      <label>Пол<select name="gender_id" value={form.gender_id} onChange={change} required>
        <option value="">Не указан</option>
        <option value="1">Самец</option><option value="2">Самка</option><option value="3">Неизвестно</option>
      </select></label>
      <label>Возраст, лет<input name="age" type="number" min="0" step="1" value={form.age} onChange={change} required /></label>
      <label>Окрас<input name="color" value={form.color} onChange={change} required maxLength={100} /></label>
      <CityPicker apiUrl={apiUrl} city={city} onChange={setCity} />
      <label>Описание<textarea name="description" rows={4} value={form.description} onChange={change} required maxLength={5000} /></label>
    </EditForm>
  )
}

export function ReportEditor({ report, userId, apiUrl, onSaved, onCancel }) {
  const [form, setForm] = useState({
    report_type_id: report.report_type_id,
    title: report.title ?? '', description: report.description ?? '', location: report.location ?? '',
  })
  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }
  function save() {
    return requestJson(apiUrl + '/report/' + report.report_id, jsonOptions('PATCH', {
      ...form, user_id: userId, report_type_id: Number(form.report_type_id),
    }))
  }
  return (
    <EditForm title="Редактирование объявления" save={save} onSaved={onSaved} onCancel={onCancel}>
      <p className="profile-edit-note">Животное: {report.animal_name}. Его данные меняются отдельно в разделе «Мои животные».</p>
      <label>Тип<select name="report_type_id" value={form.report_type_id} onChange={change}>
        <option value="1">Пропало животное</option><option value="2">Найдено животное</option>
        <option value="4">Ищет дом</option>
        {report.report_type_id === 3 && <option value="3">Помощь приюту</option>}
      </select></label>
      <label>Заголовок<input name="title" value={form.title} onChange={change} required maxLength={255} /></label>
      <label>Описание<textarea name="description" rows={5} value={form.description} onChange={change} required maxLength={5000} /></label>
      <label>Место<input name="location" value={form.location} onChange={change} required maxLength={1000} /></label>
    </EditForm>
  )
}

export function AccountPanel({ profile, userId, apiUrl, onSaved, editingDisabled, onEditingChange }) {
  const [mode, setMode] = useState(null)
  function changeMode(nextMode) { setMode(nextMode); onEditingChange(nextMode !== null) }
  return (
    <section className="profile-user-info">
      <p className="profile-eyebrow">Личный кабинет</p>
      {mode === 'profile' ? <UserEditor profile={profile} userId={userId} apiUrl={apiUrl}
        onSaved={onSaved} onCancel={() => changeMode(null)} />
        : mode === 'password' ? <PasswordEditor userId={userId} apiUrl={apiUrl}
          onSaved={onSaved} onCancel={() => changeMode(null)} /> : <>
          <h2>{profile.first_name} {profile.last_name}</h2>
          <p>Город: {profile.city_name}</p><p>Телефон: {profile.phone}</p><p>Email: {profile.email}</p>
          <p>Карточек животных: {profile.animals_count}</p>
          <div className="profile-edit-actions">
            <button type="button" className="report-status-button" disabled={editingDisabled} onClick={() => changeMode('profile')}>Редактировать профиль</button>
            <button type="button" className="report-status-button" disabled={editingDisabled} onClick={() => changeMode('password')}>Сменить пароль</button>
          </div>
        </>}
    </section>
  )
}

function UserEditor({ profile, userId, apiUrl, onSaved, onCancel }) {
  const [form, setForm] = useState({ first_name: profile.first_name, last_name: profile.last_name,
    phone: profile.phone, email: profile.email })
  const [city, setCity] = useState({ city_id: profile.city_id, label: profile.city_name })
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function save() {
    if (!city) throw new Error('Выберите город из подсказок')
    const cityId = city.city_id || (await requestJson(apiUrl + '/cities/resolve', jsonOptions('POST', {
      city_name: city.city_name, city_fias_id: city.city_fias_id,
    }))).city_id
    return requestJson(apiUrl + '/user/' + userId, jsonOptions('PATCH', { ...form, city_id: cityId }))
  }
  return <EditForm title="Личные данные" save={save} onSaved={onSaved} onCancel={onCancel}>
    <label>Имя<input name="first_name" value={form.first_name} onChange={change} required maxLength={100} autoComplete="given-name" /></label>
    <label>Фамилия<input name="last_name" value={form.last_name} onChange={change} required maxLength={100} autoComplete="family-name" /></label>
    <label>Телефон<input name="phone" type="tel" value={form.phone} onChange={change} required minLength={7} maxLength={20} autoComplete="tel" /></label>
    <label>Email<input name="email" type="email" value={form.email} onChange={change} required maxLength={255} autoComplete="email" /></label>
    <CityPicker apiUrl={apiUrl} city={city} onChange={setCity} />
    <p className="profile-edit-note">После изменения email используй новый адрес для входа. Город животных и данные приюта меняются отдельно.</p>
  </EditForm>
}

function PasswordEditor({ userId, apiUrl, onSaved, onCancel }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function save() {
    if (form.new_password !== form.confirm_password) throw new Error('Новые пароли не совпадают')
    if (form.new_password === form.current_password) throw new Error('Новый пароль должен отличаться от старого')
    return requestJson(apiUrl + '/user/' + userId + '/password', jsonOptions('PATCH', form))
  }
  return <EditForm title="Смена пароля" save={save} onSaved={onSaved} onCancel={onCancel}>
    <label>Текущий пароль<input type="password" name="current_password" value={form.current_password} onChange={change} required maxLength={128} autoComplete="current-password" /></label>
    <label>Новый пароль<input type="password" name="new_password" value={form.new_password} onChange={change} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
    <label>Подтверждение нового пароля<input type="password" name="confirm_password" value={form.confirm_password} onChange={change} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
    <small>От 8 до 128 символов. Пароль не сохраняется в браузере приложением.</small>
  </EditForm>
}

export function MyAnimals({ userId, apiUrl, onSaved, onPhotosChanged, editingDisabled, onEditingChange }) {
  const [result, setResult] = useState({ items: [], loading: true, error: '' })
  const [retry, setRetry] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [photosId, setPhotosId] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const items = await requestJson(apiUrl + '/user/' + userId + '/animals', { signal: controller.signal })
        if (!controller.signal.aborted) setResult({ items, loading: false, error: '' })
      } catch {
        if (!controller.signal.aborted) setResult({ items: [], loading: false, error: 'Не удалось загрузить список животных.' })
      }
    }
    load()
    return () => controller.abort()
  }, [apiUrl, userId, retry])
  return (
    <section className="my-animals-section">
      <h3>Мои животные</h3>
      {result.loading && <p role="status">Загружаем животных…</p>}
      {result.error && <div role="alert"><p>{result.error}</p><button type="button" className="report-status-button" onClick={() => {
        setResult({ items: [], loading: true, error: '' })
        setRetry((value) => value + 1)
      }}>Повторить</button></div>}
      {!result.loading && !result.error && !result.items.length && <p>Карточки животных отсутствуют.</p>}
      <div className="my-reports-list">
        {result.items.map((animal) => (
          <article className="my-report-card" key={animal.animal_id}>
            {photosId === animal.animal_id ? (
              <AnimalPhotos animal={animal} userId={userId} apiUrl={apiUrl} onChanged={onPhotosChanged}
                onClose={() => { setPhotosId(null); onEditingChange(false) }} />
            ) : editingId === animal.animal_id ? (
              <AnimalEditor animal={animal} userId={userId} apiUrl={apiUrl}
                onSaved={onSaved} onCancel={() => { setEditingId(null); onEditingChange(false) }} />
            ) : (
              <>
                <div><h4>{animal.name || 'Без клички'}</h4><p>{animal.breed || 'Порода не указана'}</p><p>{animal.city_name || 'Город не указан'}</p></div>
                <div className="profile-report-actions">
                <button className="report-status-button" type="button" disabled={editingId !== null || photosId !== null || editingDisabled}
                  onClick={() => { setEditingId(animal.animal_id); onEditingChange(true) }}>Редактировать</button>
                <button className="report-status-button" type="button" disabled={editingId !== null || photosId !== null || editingDisabled}
                  onClick={() => { setPhotosId(animal.animal_id); onEditingChange(true) }}>Фотографии</button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
