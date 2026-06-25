from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from example_package.orm.example_item import ExampleItem
from utils.databases import create_resource, read_resource, update_resource, delete_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "item_not_found":      "Example item not found.",
    "name_already_exists": "An example item with that name already exists.",
}


class CreateExampleItemRequest(BaseModel):
    name:        str
    description: str | None = None


class UpdateExampleItemNameRequest(BaseModel):
    name: str


class UpdateExampleItemDescriptionRequest(BaseModel):
    description: str | None


class ExampleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:          int
    name:        str
    description: str | None = None
    is_archived: bool


class DeletedResponse(BaseModel):
    deleted: bool


@router.post("/", status_code=201, response_model=ExampleItemResponse)
@create_resource
def create_example_item(body: CreateExampleItemRequest) -> ExampleItem:
    existing = DatabaseConnection.execute(
        select(ExampleItem).where(ExampleItem.name == body.name)
    ).scalar_one_or_none()
    assert_preconditions([(existing is not None, 409, "name_already_exists")], ERRORS)
    return ExampleItem(name=body.name, description=body.description)


@router.get("/", response_model=list[ExampleItemResponse])
@read_resource
def read_example_items() -> list[ExampleItemResponse]:
    items = DatabaseConnection.execute(
        select(ExampleItem).order_by(ExampleItem.name)
    ).scalars().all()
    return [ExampleItemResponse.model_validate(item) for item in items]


@router.get("/{item_id}", response_model=ExampleItemResponse)
@read_resource
def read_example_item(item_id: int) -> ExampleItemResponse:
    assert_preconditions([(not (item := DatabaseConnection.get(ExampleItem, item_id)), 404, "item_not_found")], ERRORS)
    return ExampleItemResponse.model_validate(item)


@router.get("/name/{name}", response_model=ExampleItemResponse)
@read_resource
def read_example_item_by_name(name: str) -> ExampleItemResponse:
    item = DatabaseConnection.execute(
        select(ExampleItem).where(ExampleItem.name == name)
    ).scalar_one_or_none()
    assert_preconditions([(item is None, 404, "item_not_found")], ERRORS)
    return ExampleItemResponse.model_validate(item)


@router.put("/{item_id}/name", response_model=ExampleItemResponse)
@update_resource
def update_example_item_name(item_id: int, body: UpdateExampleItemNameRequest) -> ExampleItemResponse:
    assert_preconditions([(not (item := DatabaseConnection.get(ExampleItem, item_id)), 404, "item_not_found")], ERRORS)
    item.name = body.name
    return ExampleItemResponse.model_validate(item)


@router.put("/{item_id}/description", response_model=ExampleItemResponse)
@update_resource
def update_example_item_description(item_id: int, body: UpdateExampleItemDescriptionRequest) -> ExampleItemResponse:
    assert_preconditions([(not (item := DatabaseConnection.get(ExampleItem, item_id)), 404, "item_not_found")], ERRORS)
    item.description = body.description
    return ExampleItemResponse.model_validate(item)


@router.delete("/{item_id}", response_model=DeletedResponse)
@delete_resource
def delete_example_item(item_id: int) -> DeletedResponse:
    assert_preconditions([(not (item := DatabaseConnection.get(ExampleItem, item_id)), 404, "item_not_found")], ERRORS)
    DatabaseConnection.delete(item)
    return DeletedResponse(deleted=True)
