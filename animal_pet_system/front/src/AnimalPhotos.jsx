import { useEffect, useState } from 'react'
import './AnimalPhotos.css'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function AnimalPhotos({ animal, userId, apiUrl, onChanged, onClose }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(apiUrl + '/photo_list/' + animal.animal_id, { signal: controller.signal })
        if (!response.ok) throw new Error()
        const data = await response.json()
        if (!controller.signal.aborted) { setPhotos(data); setLoading(false); setLoadError('') }
      } catch {
        if (!controller.signal.aborted) { setLoading(false); setLoadError('Не удалось загрузить фотографии. Перед изменениями необходимо обновить список.') }
      }
    }
    load()
    return () => controller.abort()
  }, [apiUrl, animal.animal_id, revision])
  useEffect(() => {
    const preview = pending?.preview
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [pending?.preview])
  function reload() { setLoading(true); setLoadError(''); setRevision((value) => value + 1) }
  function choose(event, photoId = null) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(''); setNotice(''); setDeleteId(null)
    if (!ACCEPTED.includes(file.type)) { setError('Выберите JPEG, PNG или WebP'); return }
    if (!file.size || file.size > 5 * 1024 * 1024) { setError('Файл должен быть непустым и не больше 5 МБ'); return }
    setPending({ file, photoId, preview: URL.createObjectURL(file) })
  }
  async function mutate(url, options, afterSuccess) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(url, options)
      const data = await response.json()
      if (!response.ok) {
        const detail = Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join('; ') : data.detail
        throw new Error(detail || data.error || 'Не удалось сохранить фотографию')
      }
      afterSuccess()
      const message = [data.message, data.warning].filter(Boolean).join('. ')
      setNotice(message)
      onChanged(message)
    } catch (error) {
      setError(error instanceof TypeError ? 'Не удалось подтвердить изменение. Проверьте обновлённый список перед повторной попыткой.' : error.message)
    } finally { setBusy(false); reload() }
  }
  function upload() {
    const body = new FormData()
    body.append('user_id', userId)
    body.append('file', pending.file)
    if (pending.photoId) {
      mutate(apiUrl + '/animals/' + animal.animal_id + '/photos/' + pending.photoId, { method: 'PUT', body }, () => setPending(null))
    } else {
      body.append('animal_id', animal.animal_id)
      mutate(apiUrl + '/photo/upload', { method: 'POST', body }, () => setPending(null))
    }
  }
  function remove() {
    mutate(apiUrl + '/animals/' + animal.animal_id + '/photos/' + deleteId + '?user_id=' + userId,
      { method: 'DELETE' }, () => setDeleteId(null))
  }
  const disabled = busy || loading || Boolean(loadError)
  return (
    <section className="animal-photo-editor" aria-label={'Фотографии: ' + (animal.name || 'животное')}>
      <h4>Фотографии — {animal.name || 'животное'}</h4>
      <p>До двух фотографий. JPEG, PNG или WebP, до 5 МБ каждая. Изменения будут видны во всех объявлениях животного.</p>
      {loading && <p role="status">Загружаем фотографии…</p>}
      {loadError && <div role="alert"><p className="photo-editor-error">{loadError}</p>
        <button type="button" className="report-status-button" onClick={reload}>Обновить список</button></div>}
      <div className="photo-editor-grid">
        {photos.map((photo) => <figure key={photo.photo_id}>
          <img src={photo.url} alt={'Фото ' + (animal.name || 'животного')} />
          <figcaption>
            <label>Заменить фото
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || pending !== null || deleteId !== null}
                onChange={(event) => choose(event, photo.photo_id)} />
            </label>
            <button type="button" className="photo-delete-button" disabled={disabled || pending !== null || deleteId !== null}
              onClick={() => { setDeleteId(photo.photo_id); setError(''); setNotice('') }}>Удалить</button>
          </figcaption>
        </figure>)}
      </div>
      {!loading && !loadError && photos.length === 0 && <p>Фотографий пока нет.</p>}
      {!pending && photos.length < 2 && <label className="photo-add-label">Добавить фотографию
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || deleteId !== null} onChange={choose} />
      </label>}
      {photos.length >= 2 && !pending && <p>Лимит достигнут — можно заменить или удалить одну из фотографий.</p>}
      {pending && <div className="photo-preview">
        <h4>{pending.photoId ? 'Новая фотография для замены' : 'Предпросмотр'}</h4>
        <img src={pending.preview} alt="Предпросмотр выбранной фотографии" />
        <div className="profile-edit-actions">
          <button type="button" className="report-status-button" disabled={disabled} onClick={upload}>{busy ? 'Сохраняем…' : 'Сохранить фото'}</button>
          <button type="button" className="shelter-cancel-button" disabled={busy} onClick={() => setPending(null)}>Отмена</button>
        </div>
      </div>}
      {deleteId !== null && <div className="photo-delete-confirm" role="group" aria-label="Подтверждение удаления">
        <p>Удалить эту фотографию? Она исчезнет из карточки животного и его объявлений. Отменить удаление через сайт нельзя.</p>
        <div className="profile-edit-actions">
          <button type="button" className="photo-delete-button" disabled={disabled} onClick={remove}>{busy ? 'Удаляем…' : 'Да, удалить'}</button>
          <button type="button" className="shelter-cancel-button" disabled={busy} onClick={() => setDeleteId(null)}>Отмена</button>
        </div>
      </div>}
      {error && <p className="photo-editor-error" role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <button type="button" className="report-status-button" disabled={busy} onClick={onClose}>Готово</button>
    </section>
  )
}
