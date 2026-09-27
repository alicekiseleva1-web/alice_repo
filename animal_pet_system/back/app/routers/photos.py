from contextlib import contextmanager

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from psycopg2.errors import InsufficientPrivilege, InvalidParameterValue, NoDataFound

from app.schemas.photo import PhotoCreate
from app.services.cloudinary_service import delete_image, upload_image, validate_image
from app.services.photo_service import (
    check_photo_owner, save_animal_photo, delete_animal_photo, photo_list,
)

router = APIRouter()


@contextmanager
def photo_errors():
    try:
        yield
    except NoDataFound as error:
        raise HTTPException(404, error.diag.message_primary) from error
    except InsufficientPrivilege as error:
        raise HTTPException(403, error.diag.message_primary) from error
    except InvalidParameterValue as error:
        raise HTTPException(400, error.diag.message_primary) from error


def cleanup_warning(public_id):
    if public_id and not delete_image(public_id):
        return "Изменение сохранено на сайте, но старый файл не удалось удалить из Cloudinary."
    return None


def save_upload(animal_id, user_id, file, photo_id=None, report_id=None):
    with photo_errors():
        check_photo_owner(animal_id, user_id)
        existing = photo_list(animal_id)
        if photo_id is None and len(existing) >= 2:
            raise HTTPException(400, "Можно сохранить не больше двух фотографий")
        if photo_id is not None and not any(row[0] == photo_id for row in existing):
            raise HTTPException(404, "Фотография этого животного не найдена")
        try:
            validate_image(file)
        except RuntimeError as error:
            raise HTTPException(400, str(error)) from error
        try:
            uploaded = upload_image(file)
        except RuntimeError as error:
            raise HTTPException(502, str(error)) from error
        try:
            saved_id, previous_id = save_animal_photo(
                animal_id, user_id, uploaded["url"], uploaded["public_id"], photo_id, report_id)
        except Exception:
            delete_image(uploaded["public_id"])
            raise
    warning = cleanup_warning(previous_id) if previous_id != uploaded["public_id"] else None
    return {"photo_id": saved_id, "url": uploaded["url"], "warning": warning,
            "message": "Фотография заменена" if photo_id else "Фотография добавлена"}


@router.post("/photo/upload")
def upload_photo_route(
    animal_id: int = Form(..., gt=0),
    user_id: int = Form(..., gt=0),
    report_id: int | None = Form(None),
    file: UploadFile = File(...),
):
    return save_upload(animal_id, user_id, file, report_id=report_id)


@router.put("/animals/{animal_id}/photos/{photo_id}")
def replace_photo_route(
    animal_id: int, photo_id: int,
    user_id: int = Form(..., gt=0), file: UploadFile = File(...),
):
    return save_upload(animal_id, user_id, file, photo_id=photo_id)


@router.delete("/animals/{animal_id}/photos/{photo_id}")
def delete_photo_route(animal_id: int, photo_id: int, user_id: int = Query(..., gt=0)):
    with photo_errors():
        public_id = delete_animal_photo(animal_id, user_id, photo_id)
    return {"message": "Фотография удалена с сайта", "warning": cleanup_warning(public_id)}


@router.post("/photo")
def add_photo_route(photo_data: PhotoCreate):
    with photo_errors():
        photo_id, _ = save_animal_photo(
            photo_data.animal_id, photo_data.user_id, photo_data.url, report_id=photo_data.report_id)
    return {"photo_id": photo_id}


@router.get("/photo_list/{animal_id}")
def photo_list_route(animal_id: int):
    fields = ("photo_id", "animal_id", "report_id", "url", "created_at")
    return [dict(zip(fields, row)) for row in photo_list(animal_id)]
