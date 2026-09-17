import { useEffect, useRef, useState } from 'react'
import './AnimalsPage.css'

const PAGE_SIZE = 24
const genderLabels = { 1: 'Самец', 2: 'Самка', 3: 'Неизвестно' }

function formatAge(age) {
  if (age === null) return 'Возраст не указан'
  const lastTwo = age % 100
  const last = age % 10
  const unit = lastTwo >= 11 && lastTwo <= 14
    ? 'лет'
    : last === 1 ? 'год' : last >= 2 && last <= 4 ? 'года' : 'лет'
  return `${age} ${unit}`
}

function AnimalPhoto({ url, name }) {
  const [failed, setFailed] = useState(false)

  return url && !failed ? (
    <img src={url} alt={name || 'Животное'} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <span className="animal-photo-placeholder">
      <span aria-hidden="true">🐾</span>
      Фото пока нет
    </span>
  )
}

function AnimalDialog({ animal, apiUrl, onClose }) {
  const dialogRef = useRef(null)
  const [photos, setPhotos] = useState(
    animal.photo_url ? [{ photo_id: 'cover', url: animal.photo_url }] : [],
  )
  const [photoStatus, setPhotoStatus] = useState('loading')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function loadPhotos() {
      try {
        const response = await fetch(
          apiUrl + '/photo_list/' + animal.animal_id,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Не удалось загрузить фотографии')
        const data = await response.json()
        if (controller.signal.aborted) return
        setPhotos(data)
        setPhotoIndex(0)
        setPhotoStatus('success')
      } catch {
        if (!controller.signal.aborted) setPhotoStatus('error')
      }
    }
    loadPhotos()
    return () => controller.abort()
  }, [apiUrl, animal.animal_id])

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (isExpanded) setIsExpanded(false)
      else onClose()
    }
    if (isExpanded && photos.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      setPhotoIndex((index) => (index + direction + photos.length) % photos.length)
    }
    if (event.key === 'Tab') {
      const elements = dialogRef.current.querySelectorAll('button:not(:disabled), a[href]')
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  return (
    <div className="animal-dialog-overlay" onClick={onClose}>
      <section
        ref={dialogRef}
        className={'animal-dialog' + (isExpanded ? ' animal-dialog-expanded' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="animal-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close-button" type="button" aria-label="Закрыть карточку" onClick={onClose}>×</button>
        <h2 id="animal-dialog-title">{animal.animal_name || 'Без клички'}</h2>
        {!isExpanded && (
          <>
            <p className="animal-description">{animal.description || 'Описание пока не добавлено.'}</p>
            <div className="animal-facts">
              <p>Город: {animal.city_name || 'Не указан'}</p>
              <p>Порода: {animal.breed || 'Не указана'}</p>
              <p>Пол: {genderLabels[animal.gender_id] || 'Не указан'}</p>
              <p>Возраст: {formatAge(animal.age)}</p>
              <p>Окрас: {animal.color || 'Не указан'}</p>
            </div>
            <h3>Фотографии</h3>
          </>
        )}
        {photoStatus === 'loading' && <p role="status">Загружаем фотографии…</p>}
        {photoStatus === 'error' && <p role="alert">Не удалось загрузить все фотографии. Попробуй открыть карточку ещё раз.</p>}
        {photos.length > 0 ? (
          <>
            <button
              type="button"
              className="animal-gallery-image"
              aria-label={isExpanded ? 'Уменьшить фотографию' : 'Увеличить фотографию'}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <AnimalPhoto key={photos[photoIndex].url} url={photos[photoIndex].url} name={animal.animal_name} />
            </button>
            {photos.length > 1 && (
              <div className="animal-gallery-controls">
                <button type="button" aria-label="Предыдущая фотография" onClick={() => setPhotoIndex((index) => (index - 1 + photos.length) % photos.length)}>←</button>
                <span aria-live="polite">{photoIndex + 1} из {photos.length}</span>
                <button type="button" aria-label="Следующая фотография" onClick={() => setPhotoIndex((index) => (index + 1) % photos.length)}>→</button>
              </div>
            )}
          </>
        ) : photoStatus === 'success' && <p>Фотографии пока не добавлены.</p>}
        {isExpanded ? (
          <button className="animal-secondary-button" type="button" onClick={() => setIsExpanded(false)}>Вернуться к описанию</button>
        ) : (
          <div className="animal-contact">
            <h3>Контакты</h3>
            <p>{animal.shelter_name || animal.owner_name || 'Имя не указано'}</p>
            <p>{animal.owner_phone || 'Телефон не указан'}</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default function AnimalsPage({ apiUrl }) {
  const [search, setSearch] = useState('')
  const [request, setRequest] = useState({ query: '', page: 0, revision: 0 })
  const [result, setResult] = useState({ items: [], busy: true, error: '', hasMore: false })
  const [selectedAnimal, setSelectedAnimal] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function loadAnimals() {
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE + 1),
          offset: String(request.page * PAGE_SIZE),
        })
        if (request.query) params.set('query', request.query)
        const response = await fetch(apiUrl + '/animals?' + params, { signal: controller.signal })
        if (!response.ok) throw new Error('Не удалось загрузить животных. Попробуй ещё раз.')
        const data = await response.json()
        if (controller.signal.aborted) return
        setResult((current) => {
          const items = request.page === 0
            ? data.slice(0, PAGE_SIZE)
            : [...current.items, ...data.slice(0, PAGE_SIZE)]
          return {
            items: [...new Map(items.map((item) => [item.animal_id, item])).values()],
            busy: false,
            error: '',
            hasMore: data.length > PAGE_SIZE,
          }
        })
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult((current) => ({ ...current, busy: false, error: error.message }))
        }
      }
    }
    loadAnimals()
    return () => controller.abort()
  }, [apiUrl, request])

  function submitSearch(event) {
    event.preventDefault()
    setResult({ items: [], busy: true, error: '', hasMore: false })
    setRequest((current) => ({ query: search.trim(), page: 0, revision: current.revision + 1 }))
  }

  function loadMore() {
    setResult((current) => ({ ...current, busy: true, error: '' }))
    setRequest((current) => ({ ...current, page: current.page + 1 }))
  }

  function retry() {
    setResult((current) => ({ ...current, busy: true, error: '' }))
    setRequest((current) => ({ ...current, revision: current.revision + 1 }))
  }

  return (
    <section className="animals-page" id="animals">
      <div className="animals-heading">
        <p className="eyebrow">Знакомься с нашими подопечными</p>
        <h1>Животные</h1>
        <p>Фото, характер и контакты — всё о каждом животном в одной карточке.</p>
      </div>
      <form className="animals-search" onSubmit={submitSearch} role="search" aria-label="Поиск животных">
        <label htmlFor="animal-search">Кличка, порода или город</label>
        <div>
          <input id="animal-search" type="search" value={search} maxLength={100}
            onChange={(event) => setSearch(event.target.value)} placeholder="Например, Печенька или Санкт-Петербург" />
          <button type="submit">Найти</button>
        </div>
      </form>
      {result.error && (
        <div className="animals-error" role="alert">
          <p>{result.error}</p>
          <button className="animal-secondary-button" type="button" onClick={retry}>Повторить</button>
        </div>
      )}
      {result.busy && <p role="status">Загружаем животных…</p>}
      {!result.busy && !result.error && result.items.length === 0 && (
        <div className="animals-empty">
          <span aria-hidden="true">🐾</span>
          <h2>{request.query ? 'Никого не нашли' : 'Здесь скоро появятся животные'}</h2>
          <p>{request.query ? 'Попробуй другую кличку, породу или город. Для полного списка очисти поиск и нажми «Найти».' : 'Карточки появятся после добавления животных в приложение.'}</p>
        </div>
      )}
      <div className="animals-grid" aria-busy={result.busy}>
        {result.items.map((animal) => (
          <article className="animal-card" key={animal.animal_id}>
            <button className="animal-card-button" type="button" onClick={() => setSelectedAnimal(animal)}>
              <span className="animal-card-image">
                <AnimalPhoto key={animal.photo_url} url={animal.photo_url} name={animal.animal_name} />
              </span>
              <span className="animal-card-body">
                <span className="animal-card-name">{animal.animal_name || 'Без клички'}</span>
                <span>{animal.breed || 'Порода не указана'} · {formatAge(animal.age)}</span>
                <span className="animal-card-city">{animal.city_name || 'Город не указан'}</span>
                <span className="animal-card-link">Познакомиться →</span>
              </span>
            </button>
          </article>
        ))}
      </div>
      {result.hasMore && !result.error && (
        <button className="animals-more" type="button" disabled={result.busy} onClick={loadMore}>
          {result.busy ? 'Загружаем…' : 'Показать ещё'}
        </button>
      )}
      {selectedAnimal && (
        <AnimalDialog key={selectedAnimal.animal_id} animal={selectedAnimal} apiUrl={apiUrl} onClose={() => setSelectedAnimal(null)} />
      )}
    </section>
  )
}

