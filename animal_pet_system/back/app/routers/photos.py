from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.photo import PhotoCreate

from app.services.cloudinary_service import (
    delete_image,
    upload_image,
)

from app.services.photo_service import (
    add_photo,
    photo_list
)

router = APIRouter()


@router.post("/photo/upload")
def upload_photo_route(
    animal_id: int = Form(...),
    report_id: int | None = Form(None),
    file: UploadFile = File(...),
):
    uploaded_image = upload_image(file)

    try:
        photo_id = add_photo(
            animal_id,
            report_id,
            uploaded_image["url"],
        )
    except Exception:
        delete_image(uploaded_image["public_id"])
        raise

    return {
        "photo_id": photo_id,
        "url": uploaded_image["url"],
    }

@router.post("/photo")
def add_photo_route(photo_data: PhotoCreate):
    photo_id = add_photo(
        photo_data.animal_id,
        photo_data.report_id,
        photo_data.url
    )
    return {
        "photo_id": photo_id
    }

@router.get("/photo_list/{animal_id}")
def photo_list_route(animal_id: int):
    photos = photo_list(animal_id)

    result = []

    for item in photos:
        result.append(
            {
                "photo_id": item[0],
                "animal_id": item[1],
                "report_id": item[2],
                "url": item[3],
                "created_at": item[4]
            }
        )

    return result
