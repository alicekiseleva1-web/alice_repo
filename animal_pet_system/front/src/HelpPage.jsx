import { useEffect, useRef, useState } from 'react'
import './HelpPage.css'

const PAGE_SIZE = 12

async function getJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join('; ') : data.detail
    throw new Error(detail || data.error || 'Не удалось выполнить запрос')
  }
  return data
}
function jsonOptions(method, body) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
function messageFor(error) {
  return error instanceof TypeError ? 'Нет связи с сервером. Проверьте подключение и повторите попытку.' : error.message
}

function HelpForm({ item, categories, apiUrl, userId, shelter, onCancel, onSaved }) {
  const [form, setForm] = useState({
    title: item?.title || '', description: item?.description || '',
    help_category_id: item?.help_category_id || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const headingRef = useRef(null)
  useEffect(() => { headingRef.current?.focus() }, [])
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const body = { ...form, user_id: userId, help_category_id: Number(form.help_category_id) }
      if (!item) body.shelter_id = shelter.shelter_id
      await getJson(apiUrl + '/help_request' + (item ? '/' + item.request_id : ''),
        jsonOptions(item ? 'PATCH' : 'POST', body))
      onSaved(item ? 'Заявка обновлена' : 'Заявка опубликована')
    } catch (error) {
      setError(messageFor(error))
    } finally { setBusy(false) }
  }
  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }
  return (
    <form className="help-form" onSubmit={submit}>
      <h2 ref={headingRef} tabIndex={-1}>{item ? 'Редактировать заявку' : 'Рассказать, какая помощь нужна'}</h2>
      <p>От имени приюта «{shelter.name}»</p>
      <fieldset disabled={busy}>
        <label>Категория помощи
          <select name="help_category_id" required value={form.help_category_id} onChange={change}>
            <option value="">Выберите категорию</option>
            {categories.map((category) => <option key={category.help_category_id} value={category.help_category_id}>{category.name}</option>)}
          </select>
        </label>
        <label>Что нужно?
          <input name="title" value={form.title} onChange={change} required maxLength={255} placeholder="Например, ищем волонтёров для выгула в субботу" />
        </label>
        <label>Подробности
          <textarea name="description" value={form.description} onChange={change} required maxLength={5000} rows={6}
            placeholder="Укажите, что и в каком количестве требуется, когда и как можно помочь." />
        </label>
        <small>Не публикуйте пароли, коды подтверждения и данные банковских карт. Финансовую помощь можно обсудить с приютом по контактам в карточке.</small>
        <div className="help-actions">
          <button className="help-primary" type="submit">{busy ? 'Сохраняем…' : item ? 'Сохранить' : 'Опубликовать'}</button>
          <button className="help-secondary" type="button" onClick={onCancel}>Отмена</button>
        </div>
      </fieldset>
      {error && <p className="help-error" role="alert">{error}</p>}
    </form>
  )
}

function HelpDetails({ item, canManage, statuses, apiUrl, userId, onClose, onEdit, onSaved }) {
  const dialogRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => { document.body.style.overflow = overflow; previousFocus?.focus() }
  }, [])
  function keyDown(event) {
    if (event.key === 'Escape' && !busy) onClose()
    if (event.key === 'Tab') {
      const elements = dialogRef.current.querySelectorAll('button:not(:disabled), a[href]')
      const first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault(); first?.focus()
      }
    }
  }
  async function changeStatus(statusId) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await getJson(apiUrl + '/help_request/' + item.request_id + '/status', jsonOptions('PATCH', {
        user_id: userId, help_request_status_id: statusId,
      }))
      onSaved('Статус заявки изменён')
    } catch (error) { setError(messageFor(error)) }
    finally { setBusy(false) }
  }
  const phone = item.contact_phone?.replace(/[^+0-9]/g, '')
  const statusLabels = { open: 'Открыть снова', in_progress: 'Помощь в процессе', closed: 'Закрыть заявку' }
  return (
    <div className="help-overlay" onClick={() => { if (!busy) onClose() }}>
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"
        ref={dialogRef} tabIndex={-1} onKeyDown={keyDown} onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-button" type="button" disabled={busy} onClick={onClose} aria-label="Закрыть заявку">×</button>
        <span className="help-category-badge">{item.category_name || 'Категория не выбрана'}</span>
        <h2 id="help-title">{item.title || 'Заявка помощи'}</h2>
        {item.status_code !== 'open' && (
          <p className="help-status">{item.status_code === 'closed' ? 'Потребность закрыта' : item.status_name}</p>
        )}
        <p className="help-description">{item.description}</p>
        <div className="help-contacts">
          <h3>{item.shelter_name}</h3>
          <p>{item.city_name || 'Город не указан'}</p>
          {item.shelter_address && <p>{item.shelter_address}</p>}
          <h4>Связаться с приютом</h4>
          {phone && <a href={'tel:' + phone}>{item.contact_phone}</a>}
          {item.contact_email && <a href={'mailto:' + encodeURIComponent(item.contact_email)}>{item.contact_email}</a>}
          {!phone && !item.contact_email && <p>Контакты пока не указаны.</p>}
          <small>Согласуй с приютом актуальную потребность и удобное время помощи. Переводы через сайт не принимаются.</small>
        </div>
        {canManage && <div className="help-management">
          <h3>Управление заявкой</h3>
          <div className="help-actions">
            <button type="button" className="help-secondary" disabled={busy} onClick={() => onEdit(item)}>Редактировать</button>
            {statuses.filter((status) => status.help_request_status_id !== item.help_request_status_id).map((status) => (
              <button key={status.help_request_status_id} type="button" className="help-secondary" disabled={busy}
                onClick={() => changeStatus(status.help_request_status_id)}>{statusLabels[status.code] || status.name}</button>
            ))}
          </div>
        </div>}
        {error && <p className="help-error" role="alert">{error}</p>}
      </section>
    </div>
  )
}

export default function HelpPage({ apiUrl, userId }) {
  const [options, setOptions] = useState({ categories: [], statuses: [], shelter: null, ready: false, error: '' })
  const [optionsRetry, setOptionsRetry] = useState(0)
  const [request, setRequest] = useState({ categoryId: null, mine: false, page: 0, revision: 0 })
  const [result, setResult] = useState({ items: [], busy: true, error: '', hasMore: false })
  const [selected, setSelected] = useState(null)
  const [editor, setEditor] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function loadOptions() {
      try {
        const [categories, statuses, shelter] = await Promise.all([
          getJson(apiUrl + '/help_categories', { signal: controller.signal }),
          getJson(apiUrl + '/help_request_statuses', { signal: controller.signal }),
          userId ? getJson(apiUrl + '/user/' + userId + '/shelter', { signal: controller.signal }) : Promise.resolve(null),
        ])
        if (!controller.signal.aborted) setOptions({ categories, statuses, shelter, ready: true, error: '' })
      } catch (error) {
        if (!controller.signal.aborted) setOptions((current) => ({ ...current, error: messageFor(error) }))
      }
    }
    loadOptions()
    return () => controller.abort()
  }, [apiUrl, userId, optionsRetry])

  useEffect(() => {
    if (!options.ready) return
    const controller = new AbortController()
    async function loadRequests() {
      try {
        const params = new URLSearchParams({ limit: PAGE_SIZE + 1, offset: request.page * PAGE_SIZE })
        if (request.categoryId) params.set('help_category_id', request.categoryId)
        if (request.mine && options.shelter) {
          params.set('shelter_id', options.shelter.shelter_id)
          params.set('include_closed', 'true')
        }
        const data = await getJson(apiUrl + '/help_request_list?' + params, { signal: controller.signal })
        if (controller.signal.aborted) return
        setResult((current) => ({
          items: request.page === 0 ? data.slice(0, PAGE_SIZE)
            : [...new Map([...current.items, ...data.slice(0, PAGE_SIZE)].map((item) => [item.request_id, item])).values()],
          busy: false, error: '', hasMore: data.length > PAGE_SIZE,
        }))
      } catch (error) {
        if (!controller.signal.aborted) setResult((current) => ({ ...current, busy: false, error: messageFor(error) }))
      }
    }
    loadRequests()
    return () => controller.abort()
  }, [apiUrl, request, options.ready, options.shelter])

  function refresh(changes = {}) {
    setResult({ items: [], busy: true, error: '', hasMore: false })
    setRequest((current) => ({ ...current, ...changes, page: 0, revision: current.revision + 1 }))
  }
  function saved(message) {
    setEditor(null); setSelected(null); setNotice(message)
    refresh({ mine: true, categoryId: null })
  }
  return (
    <section className="help-page" id="help">
      <header className="help-heading">
        <div><p className="eyebrow">Вместе заботиться проще</p><h1>Помочь приютам</h1>
          <p>Выберите удобный способ помощи. Даже несколько часов времени или пакет корма могут быть важны.</p></div>
        {options.shelter && <button type="button" className="help-primary" disabled={editor !== null}
          onClick={() => { setEditor({ item: null }); setNotice('') }}>Нужна помощь</button>}
      </header>
      {options.error && <div className="help-error" role="alert"><p>{options.error}</p>
        <button type="button" className="help-secondary" onClick={() => {
          setOptions((current) => ({ ...current, error: '' }))
          setOptionsRetry((value) => value + 1)
        }}>Повторить</button></div>}
      {!options.ready && !options.error && <p role="status">Загружаем раздел…</p>}
      {options.ready && <>
        <div className="help-category-grid" role="group" aria-label="Категории помощи">
          {options.categories.map((category, index) => (
            <button key={category.help_category_id} className={'help-category-tile help-tone-' + index} type="button"
              aria-pressed={request.categoryId === category.help_category_id}
              onClick={() => refresh({ categoryId: category.help_category_id })}>
              <strong>{category.name}</strong><span>{category.description}</span>
            </button>
          ))}
        </div>
        <div className="help-toolbar">
          <button type="button" className="help-secondary" aria-pressed={request.categoryId === null}
            onClick={() => refresh({ categoryId: null })}>Все категории</button>
          {options.shelter ? <label><input type="checkbox" checked={request.mine}
            onChange={(event) => refresh({ mine: event.target.checked })} />Заявки моего приюта, включая закрытые</label>
            : <p>Публиковать заявки могут только представители приюта</p>}
        </div>
        {editor && <HelpForm key={editor.item?.request_id || 'new'} item={editor.item} categories={options.categories}
          apiUrl={apiUrl} userId={userId} shelter={options.shelter}
          onCancel={() => setEditor(null)} onSaved={saved} />}
        {notice && <p className="help-notice" role="status">{notice}</p>}
        {result.error && <div className="help-error" role="alert"><p>{result.error}</p>
          <button type="button" className="help-secondary" onClick={() => refresh()}>Повторить</button></div>}
        {result.busy && <p role="status">Загружаем заявки…</p>}
        {!result.busy && !result.error && result.items.length === 0 && <div className="help-empty">
          <h2>Здесь пока нет заявок</h2><p>Выберите другую категорию{options.shelter ? ' или опубликуйте заявку от имени приюта.' : ' или вернитесь позже.'}</p>
        </div>}
        <div className="help-cards" aria-busy={result.busy}>
          {result.items.map((item) => <article className="help-card" key={item.request_id}>
            <span className="help-category-badge">{item.category_name || 'Категория не выбрана'}</span>
            <h2>{item.title || 'Заявка помощи'}</h2><p className="help-card-excerpt">{item.description}</p>
            <div className="help-card-shelter"><strong>{item.shelter_name}</strong><span>{item.city_name || 'Город не указан'}</span></div>
            {item.status_code !== 'open' && (
              <p className="help-status">{item.status_code === 'closed' ? 'Потребность закрыта' : item.status_name}</p>
            )}
            <button className="help-secondary" type="button" disabled={editor !== null}
              onClick={() => setSelected(item)}>{item.status_code === 'closed' ? 'Подробнее' : 'Как помочь'} →</button>
          </article>)}
        </div>
        {result.hasMore && !result.error && <button className="help-more help-secondary" type="button" disabled={result.busy}
          onClick={() => {
            setResult((current) => ({ ...current, busy: true }))
            setRequest((current) => ({ ...current, page: current.page + 1 }))
          }}>Показать ещё</button>}
      </>}
      {selected && <HelpDetails key={selected.request_id} item={selected} canManage={options.shelter?.shelter_id === selected.shelter_id}
        statuses={options.statuses} apiUrl={apiUrl} userId={userId}
        onClose={() => setSelected(null)} onEdit={(item) => { setSelected(null); setEditor({ item }); setNotice('') }} onSaved={saved} />}
    </section>
  )
}
