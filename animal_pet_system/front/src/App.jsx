//содержимое главной страницы, интерфейс приложения
import { useEffect, useRef, useState } from 'react'
import './App.css'
import AnimalsPage from './AnimalsPage'
import { AccountPanel, MyAnimals, ReportEditor } from './ProfileEditor'
import HelpPage from './HelpPage'

const API_URL = 'http://127.0.0.1:8000'
const CURRENT_USER_ID_STORAGE_KEY = 'animal_help_current_user_id'

const genderOptions = [
  { id: 1, label: 'Самец' },
  { id: 2, label: 'Самка' },
  { id: 3, label: 'Неизвестно' },
]

const reportTypeOptions = [
  { id: 1, label: 'Пропало животное' },
  { id: 2, label: 'Найдено животное' },
  { id: 4, label: 'Ищет дом' },
]

function getReportTypeLabel(reportTypeId) {
  if (reportTypeId === 3) return 'Помощь приюту'
  return reportTypeOptions.find((option) => option.id === reportTypeId)?.label
    || 'Объявление'
}

const MAX_PHOTO_FILES = 2
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const OPEN_REPORT_STATUS_ID = 1
const CLOSED_REPORT_STATUS_ID = 2

function getSavedUserId() {
  const savedUserId = window.localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY)
  const userId = Number(savedUserId)

  return Number.isInteger(userId) && userId > 0 ? userId : null
}

function App() {
  const [isAnimalsPage, setIsAnimalsPage] = useState(() => window.location.hash === '#animals')
  const [isHelpPage, setIsHelpPage] = useState(() => window.location.hash === '#help')
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([])
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
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
    is_shelter: false,
    shelter_name: '',
    shelter_address: '',
    shelter_description: '',
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
  const [currentUserId, setCurrentUserId] = useState(getSavedUserId)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileTab, setProfileTab] = useState('animals')
  const [profileData, setProfileData] = useState(null)
  const [myReports, setMyReports] = useState([])
  const [editingReportId, setEditingReportId] = useState(null)
  const [isAnimalEditing, setIsAnimalEditing] = useState(false)
  const [isAccountEditing, setIsAccountEditing] = useState(false)
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileActionReportId, setProfileActionReportId] = useState(null)
  const [shelterData, setShelterData] = useState(null)
  const [shelterEditData, setShelterEditData] = useState({
    name: '',
    address: '',
    description: '',
  })
  const [isShelterEditing, setIsShelterEditing] = useState(false)
  const [shelterActionStatus, setShelterActionStatus] = useState('idle')
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState([])
  const [citySearchStatus, setCitySearchStatus] = useState('idle')
  const [citySearchMessage, setCitySearchMessage] = useState('')
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false)
  const [animalData, setAnimalData] = useState({
    name: '',
    breed: '',
    gender_id: 1,
    age: '',
    color: '',
    city_id: null,
    description: '',
  })
  const [newReportData, setNewReportData] = useState({
    report_type_id: 1,
    title: '',
    description: '',
    location: '',
  })
  const [animalCityQuery, setAnimalCityQuery] = useState('')
  const [animalCitySuggestions, setAnimalCitySuggestions] = useState([])
  const [animalCitySearchStatus, setAnimalCitySearchStatus] = useState('idle')
  const [animalCitySearchMessage, setAnimalCitySearchMessage] = useState('')
  const [createReportStatus, setCreateReportStatus] = useState('idle')
  const [createReportMessage, setCreateReportMessage] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [publicationNotice, setPublicationNotice] = useState(null)
  const publicationInFlight = useRef(false)
  const publicationNoticeRef = useRef(null)

  useEffect(() => {
    if (publicationNotice) publicationNoticeRef.current?.focus()
  }, [publicationNotice])

  useEffect(() => {
    function handleNavigation() {
      setIsAnimalsPage(window.location.hash === '#animals')
      setIsHelpPage(window.location.hash === '#help')
      setIsModalOpen(false)
      setIsPhotoViewerOpen(false)
    }
    window.addEventListener('hashchange', handleNavigation)
    return () => window.removeEventListener('hashchange', handleNavigation)
  }, [])

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

  useEffect(() => {
    const query = animalCityQuery.trim()

    if (query.length < 3 || animalData.city_id) {
      return undefined
    }

    const controller = new AbortController()

    const timeoutId = window.setTimeout(async () => {
      try {
        setAnimalCitySearchStatus('loading')
        setAnimalCitySearchMessage('')

        const response = await fetch(API_URL + '/cities/suggest', {
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

        setAnimalCitySuggestions(data)
        setAnimalCitySearchStatus('success')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAnimalCitySearchStatus('error')
          setAnimalCitySearchMessage(error.message)
        }
      }
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [animalCityQuery, animalData.city_id])

  useEffect(() => {
    if (currentUserId) {
      window.localStorage.setItem(
        CURRENT_USER_ID_STORAGE_KEY,
        String(currentUserId),
      )
      return
    }

    window.localStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
  }, [currentUserId])

  useEffect(() => {
    if (!isPhotoViewerOpen) {
      return undefined
    }

    function handlePhotoViewerKey(event) {
      if (event.key === 'Escape') {
        setIsPhotoViewerOpen(false)
      }

      if (selectedReportPhotos.length > 1 && event.key === 'ArrowLeft') {
        setSelectedPhotoIndex(
          (index) => (index - 1 + selectedReportPhotos.length) % selectedReportPhotos.length,
        )
      }

      if (selectedReportPhotos.length > 1 && event.key === 'ArrowRight') {
        setSelectedPhotoIndex(
          (index) => (index + 1) % selectedReportPhotos.length,
        )
      }
    }

    window.addEventListener('keydown', handlePhotoViewerKey)

    return () => {
      window.removeEventListener('keydown', handlePhotoViewerKey)
    }
  }, [isPhotoViewerOpen, selectedReportPhotos.length])

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
      const reportsWithPhotos = await addPhotosToReports(data)

      setReports(reportsWithPhotos)
      setStatus('success')
    } catch (error) {
      setError(error.message)
      setStatus('error')
    }
  }

  async function addPhotosToReports(reportList) {
    const animalIds = [...new Set(reportList.map((report) => report.animal_id))]

    const photoLists = await Promise.all(
      animalIds.map(async (animalId) => {
        try {
          const response = await fetch(API_URL + '/photo_list/' + animalId)

          if (!response.ok) {
            return [animalId, []]
          }

          return [animalId, await response.json()]
        } catch {
          return [animalId, []]
        }
      }),
    )

    const photosByAnimal = new Map(photoLists)

    return reportList.map((report) => {
      const animalPhotos = photosByAnimal.get(report.animal_id) || []
      const reportPhotos = animalPhotos.filter(
        (photo) => photo.report_id === report.report_id,
      )

      return {
        ...report,
        photos: reportPhotos.length > 0 ? reportPhotos : animalPhotos,
      }
    })
  }

  async function loadReportDetails(reportId) {
  try {
    setSelectedReportStatus('loading')
    setSelectedReportPhotos([])
    setIsPhotoViewerOpen(false)
    setSelectedPhotoIndex(0)
    setIsModalOpen(true)

    const response = await fetch(`${API_URL}/report/${reportId}`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить объявление')
    }

    const data = await response.json()
    const photoResponse = await fetch(API_URL + '/photo_list/' + data.animal_id)
    const animalPhotos = photoResponse.ok ? await photoResponse.json() : []
    const reportPhotos = animalPhotos.filter(
      (photo) => photo.report_id === reportId,
    )

    setSelectedReport(data)
    setSelectedReportPhotos(
      reportPhotos.length > 0 ? reportPhotos : animalPhotos,
    )
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
    setRegistrationMessage('Выберите город из подсказок')
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
      is_shelter: false,
      shelter_name: '',
      shelter_address: '',
      shelter_description: '',
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
  setIsProfileModalOpen(false)
  setProfileData(null)
  setMyReports([])
  setShelterData(null)
  setIsShelterEditing(false)
  setLoginData({
    email: '',
    password: '',
  })
}

async function loadProfile() {
  if (!currentUserId) {
    return
  }

  try {
    setProfileStatus('loading')

    const [userResponse, reportsResponse, shelterResponse] = await Promise.all([
      fetch(API_URL + '/user/' + currentUserId),
      fetch(API_URL + '/user/' + currentUserId + '/reports'),
      fetch(API_URL + '/user/' + currentUserId + '/shelter'),
    ])
    const userResponseData = await userResponse.json()
    const reportsResponseData = await reportsResponse.json()
    const shelterResponseData = await shelterResponse.json()

    if (!userResponse.ok) {
      throw new Error(
        userResponseData.detail
          || userResponseData.error
          || 'Не удалось загрузить профиль',
      )
    }

    if (!reportsResponse.ok) {
      throw new Error(
        reportsResponseData.detail
          || reportsResponseData.error
          || 'Не удалось загрузить объявления',
      )
    }

    if (!shelterResponse.ok) {
      throw new Error(
        shelterResponseData.detail
          || shelterResponseData.error
          || 'Не удалось загрузить данные приюта',
      )
    }

    setProfileData(userResponseData)
    setMyReports(reportsResponseData)
    setShelterData(shelterResponseData)
    setShelterEditData(
      shelterResponseData
        ? {
            name: shelterResponseData.name,
            address: shelterResponseData.address,
            description: shelterResponseData.description,
          }
        : {
            name: '',
            address: '',
            description: '',
          },
    )
    setIsShelterEditing(false)
    setProfileStatus('success')
  } catch (error) {
    setProfileStatus('error')
    setProfileMessage(error.message)
  }
}

function openProfileModal() {
  setProfileTab('animals')
  setEditingReportId(null)
  setIsAnimalEditing(false)
  setIsAccountEditing(false)
  setProfileMessage('')
  setIsProfileModalOpen(true)
  loadProfile()
}

async function changeMyReportStatus(reportId, reportStatusId) {
  try {
    setProfileActionReportId(reportId)
    setProfileMessage('')

    const response = await fetch(API_URL + '/report/' + reportId + '/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUserId,
        report_status_id: reportStatusId,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || data.error || 'Не удалось изменить статус объявления',
      )
    }

    await loadProfile()
    setCatalogRevision((value) => value + 1)
    setProfileMessage(data.message)
    await loadReports(null)
  } catch (error) {
    setProfileMessage(error.message)
  } finally {
    setProfileActionReportId(null)
  }
}

function handleProfileItemSaved(message) {
  setEditingReportId(null)
  setIsAnimalEditing(false)
  setIsAccountEditing(false)
  setProfileMessage(message)
  setCatalogRevision((value) => value + 1)
  setIsModalOpen(false)
  setIsPhotoViewerOpen(false)
  setSelectedReport(null)
  loadProfile()
  loadReports(selectedType)
}

function handlePhotosChanged(message) {
  setProfileMessage(message)
  setCatalogRevision((value) => value + 1)
  setIsModalOpen(false)
  setIsPhotoViewerOpen(false)
  setSelectedReport(null)
  loadReports(selectedType)
}

function startShelterEditing() {
  if (isAnimalEditing || editingReportId !== null) return
  if (!shelterData) {
    return
  }

  setShelterEditData({
    name: shelterData.name,
    address: shelterData.address,
    description: shelterData.description,
  })
  setProfileMessage('')
  setIsShelterEditing(true)
}

function cancelShelterEditing() {
  setIsShelterEditing(false)
  setProfileMessage('')
}

async function saveShelter(event) {
  event.preventDefault()

  try {
    setShelterActionStatus('loading')
    setProfileMessage('')

    const response = await fetch(
      API_URL + '/user/' + currentUserId + '/shelter',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shelterEditData),
      },
    )
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || data.error || 'Не удалось сохранить данные приюта',
      )
    }

    setShelterData(data)
    setShelterEditData({
      name: data.name,
      address: data.address,
      description: data.description,
    })
    setIsShelterEditing(false)
    setProfileMessage('Данные приюта сохранены')
    setCatalogRevision((value) => value + 1)
  } catch (error) {
    setProfileMessage(error.message)
  } finally {
    setShelterActionStatus('idle')
  }
}

function resetCreateReportForm() {
  setAnimalData({
    name: '',
    breed: '',
    gender_id: 1,
    age: '',
    color: '',
    city_id: null,
    description: '',
  })
  setNewReportData({
    report_type_id: 1,
    title: '',
    description: '',
    location: '',
  })
  setAnimalCityQuery('')
  setAnimalCitySuggestions([])
  setAnimalCitySearchStatus('idle')
  setAnimalCitySearchMessage('')
  setCreateReportStatus('idle')
  setCreateReportMessage('')
  setPhotoFiles([])
}

function openCreateReportModal() {
  if (publicationInFlight.current) return
  if (!currentUserId) {
    setAuthMode('login')
    setLoginMessage('Для размещения объявления необходимо войти в аккаунт')
    setIsAuthModalOpen(true)
    return
  }

  resetCreateReportForm()
  setPublicationNotice(null)
  setIsCreateReportModalOpen(true)
}

function closeCreateReportModal() {
  if (publicationInFlight.current) return
  setIsCreateReportModalOpen(false)
  resetCreateReportForm()
}

async function selectAnimalCity(suggestion) {
  try {
    setAnimalCitySearchStatus('resolving')
    setAnimalCitySearchMessage('')

    const response = await fetch(API_URL + '/cities/resolve', {
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
      throw new Error(data.detail || data.error || 'Не удалось выбрать город')
    }

    setAnimalData((currentData) => ({
      ...currentData,
      city_id: data.city_id,
    }))
    setAnimalCityQuery(data.city_name)
    setAnimalCitySuggestions([])
    setAnimalCitySearchStatus('selected')
  } catch (error) {
    setAnimalCitySearchStatus('error')
    setAnimalCitySearchMessage(error.message)
  }
}

function changeAnimalCityQuery(event) {
  const query = event.target.value

  setAnimalCityQuery(query)
  setAnimalData((currentData) => ({
    ...currentData,
    city_id: null,
  }))
  setAnimalCitySearchMessage('')

  if (query.trim().length < 3) {
    setAnimalCitySuggestions([])
    setAnimalCitySearchStatus('idle')
  }
}

function changePhotoFiles(event) {
  const files = Array.from(event.target.files)

  if (files.length > MAX_PHOTO_FILES) {
    event.target.value = ''
    setPhotoFiles([])
    setCreateReportStatus('error')
    setCreateReportMessage('Можно выбрать не больше двух фотографий')
    return
  }

  const hasInvalidType = files.some(
    (file) => !ALLOWED_PHOTO_TYPES.includes(file.type),
  )
  const hasOversizedFile = files.some(
    (file) => file.size > MAX_PHOTO_SIZE_BYTES,
  )

  if (hasInvalidType || hasOversizedFile) {
    event.target.value = ''
    setPhotoFiles([])
    setCreateReportStatus('error')
    setCreateReportMessage('Выберите JPEG, PNG или WebP размером до 5 МБ')
    return
  }

  setPhotoFiles(files)
  setCreateReportStatus('idle')
  setCreateReportMessage('')
}

function openPhotoViewer(index) {
  setSelectedPhotoIndex(index)
  setIsPhotoViewerOpen(true)
}

function showPreviousPhoto() {
  setSelectedPhotoIndex(
    (index) => (index - 1 + selectedReportPhotos.length) % selectedReportPhotos.length,
  )
}

function showNextPhoto() {
  setSelectedPhotoIndex(
    (index) => (index + 1) % selectedReportPhotos.length,
  )
}

async function createAnimalAndReport(event) {
  event.preventDefault()
  if (publicationInFlight.current) return

  if (!animalData.city_id) {
    setCreateReportStatus('error')
    setCreateReportMessage('Выберите город животного из подсказок')
    return
  }

  publicationInFlight.current = true
  try {
    setCreateReportStatus('loading')
    setCreateReportMessage('Сохраняется карточка животного…')

    const animalResponse = await fetch(API_URL + '/animals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...animalData,
        owner_id: currentUserId,
        gender_id: Number(animalData.gender_id),
        age: Number(animalData.age),
      }),
    })

    const animalResponseData = await animalResponse.json()

    if (!animalResponse.ok) {
      throw new Error(
        animalResponseData.detail
          || animalResponseData.error
          || 'Не удалось создать карточку животного',
      )
    }

    setCreateReportMessage('Сохраняется объявление…')
    const reportResponse = await fetch(API_URL + '/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newReportData,
        user_id: currentUserId,
        animal_id: animalResponseData.animal_id,
        report_type_id: Number(newReportData.report_type_id),
      }),
    })

    const reportResponseData = await reportResponse.json()

    if (!reportResponse.ok) {
      throw new Error(
        reportResponseData.detail
          || reportResponseData.error
          || 'Не удалось создать объявление',
      )
    }

    let uploadedPhotos = 0
    let photoError = ''
    try {
      for (const photoFile of photoFiles) {
        setCreateReportMessage(`Объявление создано. Загружается фотография ${uploadedPhotos + 1} из ${photoFiles.length}…`)
        const photoData = new FormData()
        photoData.append('animal_id', animalResponseData.animal_id)
        photoData.append('user_id', currentUserId)
        photoData.append('report_id', reportResponseData.report_id)
        photoData.append('file', photoFile)

        const photoResponse = await fetch(API_URL + '/photo/upload', {
          method: 'POST',
          body: photoData,
        })

        const photoResponseData = await photoResponse.json()

        if (!photoResponse.ok) {
          throw new Error(
            photoResponseData.detail
              || photoResponseData.error
              || 'Не удалось загрузить фотографию',
          )
        }
        uploadedPhotos += 1
      }
    } catch (error) {
      photoError = error.message || 'Ошибка загрузки фотографии'
    }

    setIsCreateReportModalOpen(false)
    resetCreateReportForm()
    setPublicationNotice({
      kind: photoError ? 'warning' : 'success',
      message: photoError
        ? `Объявление опубликовано, но загрузка фотографий завершилась с ошибкой: ${photoError}. Подтверждена загрузка ${uploadedPhotos} из ${photoFiles.length}. Повторная публикация не требуется. Проверьте фотографии в «Профиль → Мои животные → Фотографии» и добавьте недостающие.`
        : 'Объявление опубликовано',
    })
    setSelectedType(null)
    setCatalogRevision((revision) => revision + 1)
    void loadReports(null)
  } catch (error) {
    setCreateReportStatus('error')
    setCreateReportMessage(error.message)
  } finally {
    publicationInFlight.current = false
  }
}

  return (
    <div className="app">
      <header className="header">
        <a className="logo" href="/" aria-label="Найди друга — на главную">
          <img src="/favicon.svg" alt="Логотип Найди друга" width="64" height="64" />
        </a>

        <nav className="navigation">
          <a href="#reports">Объявления</a>
          <a href="#animals" aria-current={isAnimalsPage ? 'page' : undefined}>Животные</a>
          <a href="#help" aria-current={isHelpPage ? 'page' : undefined}>Помощь приютам</a>
        </nav>
        {currentUserId ? (
          <div className="auth-actions">
            <button
              className="profile-button"
              type="button"
              onClick={openProfileModal}
            >
              Профиль
            </button>
            <button
              className="auth-button"
              type="button"
              onClick={logoutUser}
            >
              Выйти
            </button>
          </div>
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

      {publicationNotice && (
        <div className={`publication-notice ${publicationNotice.kind}`}
          ref={publicationNoticeRef} tabIndex={-1}>
          <p role="status">{publicationNotice.message}</p>
          <button type="button" onClick={() => setPublicationNotice(null)} aria-label="Закрыть уведомление">×</button>
        </div>
      )}

      <main>
        {isAnimalsPage ? <AnimalsPage key={catalogRevision} apiUrl={API_URL} />
          : isHelpPage ? <HelpPage key={(currentUserId || 'guest') + '-' + catalogRevision} apiUrl={API_URL} userId={currentUserId} /> : (
        <>
        <section className="hero-section">
          <p className="eyebrow">Сервис поиска и помощи животным</p>
          <h1>Помогаем животным найти дорогу домой</h1>
          <p className="hero-text">
            Просматривайте объявления, помогайте приютам и делитесь важной
            информацией.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              onClick={() => loadReports()}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Загружаем...' : 'Посмотреть объявления'}
            </button>
            <button
              className="secondary-hero-button"
              type="button"
              onClick={openCreateReportModal}
            >
              Разместить объявление
            </button>
          </div>
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
              <button
                type="button"
                className={selectedType === 4 ? 'active-filter' : ''}
                onClick={() => {
                  setSelectedType(4)
                  loadReports(4)
                }}
              >
                Ищут дом
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
                  <div className="report-image">
                    <div className="report-image-placeholder">
                      <span>🐾</span>
                      <span>Фото пока нет</span>
                    </div>
                    {report.photos.length > 0 && (
                      <img
                        src={report.photos[0].url}
                        alt={"Фотография животного " + report.animal_name}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    {report.photos.length > 1 && (
                      <span className="report-photo-count">
                        +{report.photos.length - 1} фото
                      </span>
                    )}
                  </div>
                  <p className="report-type">
                    {getReportTypeLabel(report.report_type_id)}
                  </p>
                  <h3>{report.title}</h3>
                  <p>{report.description}</p>
                  <p>{report.location}</p>
                  <p>Животное: {report.animal_name}</p>
                  {report.shelter_name && (
                    <p className="report-shelter-note">
                      Находится в приюте: {report.shelter_name}
                    </p>
                  )}
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

          <div className="report-animal-details">
            <p>Город: {selectedReport.city_name || 'Не указан'}</p>
            <p>Кличка: {selectedReport.animal_name}</p>
            <p>Порода: {selectedReport.breed}</p>
            <p>Возраст: {selectedReport.age}</p>
            <p>Окрас: {selectedReport.color}</p>
          </div>

          <h3>Фотографии</h3>
          {selectedReportPhotos.length > 0 ? (
            <div className="report-photo-gallery">
              {selectedReportPhotos.map((photo, index) => (
                <button
                  className="report-photo-button"
                  key={photo.photo_id}
                  type="button"
                  onClick={() => openPhotoViewer(index)}
                >
                  <img
                    src={photo.url}
                    alt={"Открыть фотографию животного " + selectedReport.animal_name}
                  />
                </button>
              ))}
            </div>
          ) : (
            <p>Фотографии пока не добавлены.</p>
          )}

          <h3>Автор объявления</h3>
          <p>{selectedReport.user_name}</p>
          <p>{selectedReport.phone}</p>
          {selectedReport.shelter_name && (
            <p className="report-shelter-note">
              Находится в приюте: {selectedReport.shelter_name}
            </p>
          )}
        </div>
      )}
    </section>
  </div>
)}
{isPhotoViewerOpen && selectedReportPhotos.length > 0 && (
  <div
    className="photo-viewer-overlay"
    onClick={() => setIsPhotoViewerOpen(false)}
  >
    <section
      className="photo-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фотографии"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="photo-viewer-close"
        type="button"
        onClick={() => setIsPhotoViewerOpen(false)}
        aria-label="Закрыть просмотр фотографии"
      >
        ×
      </button>

      {selectedReportPhotos.length > 1 && (
        <button
          className="photo-viewer-arrow photo-viewer-arrow-left"
          type="button"
          onClick={showPreviousPhoto}
          aria-label="Предыдущая фотография"
        >
          ‹
        </button>
      )}

      <img
        src={selectedReportPhotos[selectedPhotoIndex].url}
        alt={"Увеличенная фотография животного " + selectedReport.animal_name}
      />

      {selectedReportPhotos.length > 1 && (
        <button
          className="photo-viewer-arrow photo-viewer-arrow-right"
          type="button"
          onClick={showNextPhoto}
          aria-label="Следующая фотография"
        >
          ›
        </button>
      )}

      <p className="photo-viewer-counter">
        {selectedPhotoIndex + 1} из {selectedReportPhotos.length}
      </p>
    </section>
  </div>
)}
      </section>
        </>
        )}
    </main>

      {isProfileModalOpen && (
        <div
          className="profile-modal-overlay"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Профиль пользователя"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close-button"
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              aria-label="Закрыть профиль"
            >
              ×
            </button>

            {profileStatus === 'loading' && <p>Загружаем профиль...</p>}

            {profileStatus === 'error' && (
              <p className="profile-message error">{profileMessage}</p>
            )}

            {profileStatus === 'success' && profileData && (
              <div className="profile-content">
                <AccountPanel profile={profileData} userId={currentUserId} apiUrl={API_URL}
                  onSaved={handleProfileItemSaved} onEditingChange={setIsAccountEditing}
                  editingDisabled={isAnimalEditing || editingReportId !== null || isShelterEditing || profileActionReportId !== null} />

                {shelterData && (
                  <section className="shelter-profile-section">
                    <p className="profile-eyebrow">Мой приют</p>

                    {isShelterEditing ? (
                      <form
                        className="shelter-edit-form"
                        onSubmit={saveShelter}
                      >
                        <label>
                          Название
                          <input
                            type="text"
                            value={shelterEditData.name}
                            onChange={(event) =>
                              setShelterEditData({
                                ...shelterEditData,
                                name: event.target.value,
                              })
                            }
                            required
                          />
                        </label>

                        <label>
                          Адрес
                          <input
                            type="text"
                            value={shelterEditData.address}
                            onChange={(event) =>
                              setShelterEditData({
                                ...shelterEditData,
                                address: event.target.value,
                              })
                            }
                            required
                          />
                        </label>

                        <label>
                          Описание
                          <textarea
                            value={shelterEditData.description}
                            onChange={(event) =>
                              setShelterEditData({
                                ...shelterEditData,
                                description: event.target.value,
                              })
                            }
                            rows="5"
                            required
                          />
                        </label>

                        <div className="shelter-edit-actions">
                          <button
                            className="report-status-button"
                            type="submit"
                            disabled={shelterActionStatus === 'loading'}
                          >
                            {shelterActionStatus === 'loading'
                              ? 'Сохраняем...'
                              : 'Сохранить'}
                          </button>
                          <button
                            className="shelter-cancel-button"
                            type="button"
                            onClick={cancelShelterEditing}
                            disabled={shelterActionStatus === 'loading'}
                          >
                            Отмена
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="shelter-profile-data">
                        <h3>{shelterData.name}</h3>
                        <p>{shelterData.address}</p>
                        <p>{shelterData.description}</p>
                        <button
                          className="report-status-button"
                          type="button"
                          onClick={startShelterEditing}
                          disabled={isAnimalEditing || isAccountEditing || editingReportId !== null || profileActionReportId !== null}
                        >
                          Редактировать данные
                        </button>
                      </div>
                    )}
                  </section>
                )}

                <div className="profile-sections">
                  <div className="profile-tabs" role="tablist" aria-label="Разделы личного кабинета"
                    onKeyDown={(event) => {
                      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                      event.preventDefault()
                      const tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)'))
                      const index = tabs.indexOf(document.activeElement)
                      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
                        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
                      tabs[next]?.focus()
                      tabs[next]?.click()
                    }}>
                    {[['animals', 'Мои животные'], ['reports', 'Мои объявления']].map(([id, label]) => (
                      <button key={id} id={'profile-tab-' + id} type="button" role="tab"
                        aria-selected={profileTab === id} aria-controls={'profile-panel-' + id}
                        tabIndex={profileTab === id ? 0 : -1}
                        disabled={profileTab !== id && (isAnimalEditing || editingReportId !== null || profileActionReportId !== null || isAccountEditing || isShelterEditing)}
                        onClick={() => { setProfileTab(id); setProfileMessage('') }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {(isAnimalEditing || editingReportId !== null || isAccountEditing || isShelterEditing) && (
                    <p className="profile-tabs-hint">Перед переключением раздела необходимо сохранить изменения или закрыть форму.</p>
                  )}

                {profileTab === 'reports' && (
                <section className="my-reports-section" id="profile-panel-reports" role="tabpanel"
                  aria-labelledby="profile-tab-reports" tabIndex={0}>
                  <h3>Мои объявления</h3>

                  {myReports.length === 0 && (
                    <p>Объявления отсутствуют.</p>
                  )}

                  <div className="my-reports-list">
                    {myReports.map((report) => (
                      <article className="my-report-card" key={report.report_id}>
                        {editingReportId === report.report_id ? (
                          <ReportEditor report={report} userId={currentUserId} apiUrl={API_URL}
                            onSaved={handleProfileItemSaved} onCancel={() => setEditingReportId(null)} />
                        ) : (
                        <>
                        <div>
                          <span
                            className={
                              'profile-report-status ' + report.report_status_code
                            }
                          >
                            {report.report_status_code === 'open'
                              ? 'Открыто'
                              : 'Закрыто'}
                          </span>
                          <h4>{report.title}</h4>
                          <p>{report.animal_name}</p>
                          <p>{report.location}</p>
                        </div>

                        <div className="profile-report-actions">
                          <button className="report-status-button" type="button"
                            disabled={editingReportId !== null || profileActionReportId !== null || isAnimalEditing || isAccountEditing || isShelterEditing}
                            onClick={() => { setProfileMessage(''); setEditingReportId(report.report_id) }}>
                            Редактировать
                          </button>
                        <button
                          className="report-status-button"
                          type="button"
                          onClick={() =>
                            changeMyReportStatus(
                              report.report_id,
                              report.report_status_id === OPEN_REPORT_STATUS_ID
                                ? CLOSED_REPORT_STATUS_ID
                                : OPEN_REPORT_STATUS_ID,
                            )
                          }
                          disabled={profileActionReportId !== null || editingReportId !== null || isAnimalEditing || isAccountEditing || isShelterEditing}
                        >
                          {profileActionReportId === report.report_id
                            ? 'Сохраняем...'
                            : report.report_status_id === OPEN_REPORT_STATUS_ID
                              ? 'Закрыть'
                              : 'Открыть снова'}
                        </button>
                        </div>
                        </>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
                )}

                {profileTab === 'animals' && (
                <div id="profile-panel-animals" role="tabpanel" aria-labelledby="profile-tab-animals" tabIndex={0}>
                <MyAnimals userId={currentUserId} apiUrl={API_URL} onSaved={handleProfileItemSaved}
                  onPhotosChanged={handlePhotosChanged}
                  editingDisabled={isAccountEditing || editingReportId !== null || isShelterEditing || profileActionReportId !== null}
                  onEditingChange={setIsAnimalEditing} />
                </div>
                )}
                </div>

                {profileMessage && (
                  <p className="profile-message success">{profileMessage}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {isCreateReportModalOpen && (
        <div
          className="create-report-modal-overlay"
          onClick={closeCreateReportModal}
        >
          <section
            className="create-report-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Новое объявление"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close-button"
              type="button"
              onClick={closeCreateReportModal}
              aria-label="Закрыть окно"
              disabled={createReportStatus === 'loading'}
            >
              ×
            </button>

            <form onSubmit={createAnimalAndReport} aria-busy={createReportStatus === 'loading'}>
            <fieldset className="create-report-form" disabled={createReportStatus === 'loading'}>
              <h2>Новое объявление</h2>
              <p className="create-report-intro">
                Сначала заполните карточку животного, затем данные объявления.
              </p>

              <h3>Животное</h3>

              <label>
                Кличка
                <input
                  type="text"
                  value={animalData.name}
                  onChange={(event) =>
                    setAnimalData({
                      ...animalData,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Порода
                <input
                  type="text"
                  value={animalData.breed}
                  onChange={(event) =>
                    setAnimalData({
                      ...animalData,
                      breed: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Пол
                <select
                  value={animalData.gender_id}
                  onChange={(event) =>
                    setAnimalData({
                      ...animalData,
                      gender_id: event.target.value,
                    })
                  }
                >
                  {genderOptions.map((gender) => (
                    <option key={gender.id} value={gender.id}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Возраст
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={animalData.age}
                  onChange={(event) =>
                    setAnimalData({
                      ...animalData,
                      age: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Окрас
                <input
                  type="text"
                  value={animalData.color}
                  onChange={(event) =>
                    setAnimalData({
                      ...animalData,
                      color: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="create-report-city-field">
                Город животного
                <input
                  type="text"
                  value={animalCityQuery}
                  onChange={changeAnimalCityQuery}
                  placeholder="Начните вводить город"
                  autoComplete="off"
                  required
                />
              </label>

              {animalCitySearchStatus === 'loading' && (
                <p className="city-search-status">Ищем города...</p>
              )}

              {animalCitySuggestions.length > 0 && (
                <ul className="city-suggestions">
                  {animalCitySuggestions.map((suggestion) => (
                    <li key={suggestion.city_fias_id}>
                      <button
                        type="button"
                        onClick={() => selectAnimalCity(suggestion)}
                      >
                        {suggestion.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {animalCitySearchStatus === 'selected' && (
                <p className="city-search-status success">Город выбран</p>
              )}

              {animalCitySearchMessage && (
                <p className="city-search-status error">
                  {animalCitySearchMessage}
                </p>
              )}

              <label className="form-wide-field">
                Описание животного
                <textarea
                  value={animalData.description}
                  onChange={(event) =>
                    setAnimalData({
                      ...animalData,
                      description: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="form-wide-field">
                Фотографии животного
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={changePhotoFiles}
                />
                <span className="photo-input-hint">
                  До двух файлов: JPEG, PNG или WebP, каждый до 5 МБ.
                </span>
              </label>

              {photoFiles.length > 0 && (
                <ul className="photo-file-list">
                  {photoFiles.map((file) => (
                    <li key={file.name + file.lastModified}>{file.name}</li>
                  ))}
                </ul>
              )}

              <h3 className="form-wide-field">Объявление</h3>

              <label>
                Тип объявления
                <select
                  value={newReportData.report_type_id}
                  onChange={(event) =>
                    setNewReportData({
                      ...newReportData,
                      report_type_id: event.target.value,
                    })
                  }
                >
                  {reportTypeOptions.map((reportType) => (
                    <option key={reportType.id} value={reportType.id}>
                      {reportType.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Место
                <input
                  type="text"
                  value={newReportData.location}
                  onChange={(event) =>
                    setNewReportData({
                      ...newReportData,
                      location: event.target.value,
                    })
                  }
                  placeholder="Например, Парк Победы"
                  required
                />
              </label>

              <label className="form-wide-field">
                Заголовок
                <input
                  type="text"
                  value={newReportData.title}
                  onChange={(event) =>
                    setNewReportData({
                      ...newReportData,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="form-wide-field">
                Описание объявления
                <textarea
                  value={newReportData.description}
                  onChange={(event) =>
                    setNewReportData({
                      ...newReportData,
                      description: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <button
                type="submit"
                disabled={
                  createReportStatus === 'loading'
                }
              >
                {createReportStatus === 'loading'
                  ? createReportMessage
                  : 'Опубликовать объявление'}
              </button>

              {createReportMessage && (
                <p role={createReportStatus === 'error' ? 'alert' : 'status'} className={"create-report-message " + createReportStatus}>
                  {createReportMessage}
                </p>
              )}
            </fieldset>
            </form>
          </section>
        </div>
      )}

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
                <p>Для продолжения работы с сервисом необходимо войти в аккаунт.</p>

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

                <label className="shelter-checkbox">
                  <input
                    type="checkbox"
                    checked={registrationData.is_shelter}
                    onChange={(event) =>
                      setRegistrationData({
                        ...registrationData,
                        is_shelter: event.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>Я представляю приют</strong>
                    <small>
                      Создадим аккаунт сотрудника и карточку приюта.
                    </small>
                  </span>
                </label>

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

                {registrationData.is_shelter && (
                  <>
                    <p className="shelter-fields-title">Данные приюта</p>

                    <label>
                      Название приюта
                      <input
                        type="text"
                        value={registrationData.shelter_name}
                        onChange={(event) =>
                          setRegistrationData({
                            ...registrationData,
                            shelter_name: event.target.value,
                          })
                        }
                        placeholder="Например, Добрые лапы"
                        required
                      />
                    </label>

                    <label>
                      Адрес приюта
                      <input
                        type="text"
                        value={registrationData.shelter_address}
                        onChange={(event) =>
                          setRegistrationData({
                            ...registrationData,
                            shelter_address: event.target.value,
                          })
                        }
                        placeholder="Улица, дом"
                        required
                      />
                    </label>

                    <label>
                      Описание приюта
                      <textarea
                        value={registrationData.shelter_description}
                        onChange={(event) =>
                          setRegistrationData({
                            ...registrationData,
                            shelter_description: event.target.value,
                          })
                        }
                        placeholder="Кому и чем помогает приют"
                        rows="4"
                        required
                      />
                    </label>
                  </>
                )}

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
