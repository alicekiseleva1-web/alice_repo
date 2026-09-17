from fastapi import APIRouter, HTTPException

from app.schemas.report import (
    ReportCreate,
    ReportDetail,
    ReportResponse,
    ReportStatusUpdate,
    UserReportResponse,
)

from app.services.report_service import (
    create_report,
    report_list,
    report,
    close_report,
    change_report_status,
    user_report_list,
)


router = APIRouter()


## создание объявления
## POST /report
@router.post("/report")
def create_report_route(report_data: ReportCreate):

    report_id = create_report(
        report_data.user_id,
        report_data.animal_id,
        report_data.report_type_id,
        report_data.title,
        report_data.description,
        report_data.location
    )

    return {
        "report_id": report_id
    }


## список объявлений
## GET /report_list
@router.get("/report_list", response_model=list[ReportResponse])
def report_list_route(
    report_type_id: int | None = None,
    city_id_value: int | None = None,
    limit_value: int = 20,
    offset_value: int = 0
):

    reports = report_list(
        report_type_id,
        city_id_value,
        limit_value,
        offset_value
    )

    result = []

    for item in reports:

        result.append(
            {
                "report_id": item[0],
                "animal_id": item[1],
                "animal_name": item[2],
                "user_id": item[3],
                "user_name": item[4],
                "report_type_id": item[5],
                "title": item[6],
                "description": item[7],
                "location": item[8],
                "city_id": item[9],
                "created_at": item[10]
            }
        )

    return result


## одно объявление
## GET /report/{report_id}
@router.get("/report/{report_id}", response_model=ReportDetail)
def report_route(report_id: int):

    item = report(report_id)

    if item is None:

        raise HTTPException(status_code=404, detail="объявление не найдено")

    return {

        "report_id": item[0],

        "report_title": item[1],
        "report_description": item[2],
        "report_type_id": item[3],
        "report_status_id": item[4],
        "report_created_at": item[5],

        "animal_id": item[6],
        "animal_name": item[7],
        "breed": item[8],
        "age": item[9],
        "color": item[10],
        "animal_status_id": item[11],

        "user_id": item[12],
        "user_name": item[13],
        "phone": item[14],

        "city_id": item[15]
    }


@router.patch("/report/{report_id}/close")
def close_report_route(report_id: int):
    close_report(report_id)
    return {"message": "объявление закрыто"}


@router.get("/user/{user_id}/reports", response_model=list[UserReportResponse])
def user_report_list_route(user_id: int):
    reports = user_report_list(user_id)

    return [
        {
            "report_id": item[0],
            "animal_id": item[1],
            "animal_name": item[2],
            "report_type_id": item[3],
            "title": item[4],
            "description": item[5],
            "location": item[6],
            "city_id": item[7],
            "report_status_id": item[8],
            "report_status_code": item[9],
            "created_at": item[10],
            "updated_at": item[11],
            "closed_at": item[12],
        }
        for item in reports
    ]


@router.patch("/report/{report_id}/status")
def change_report_status_route(
    report_id: int,
    status_data: ReportStatusUpdate,
):
    change_report_status(
        report_id,
        status_data.user_id,
        status_data.report_status_id,
    )
    return {"message": "статус объявления изменен"}
