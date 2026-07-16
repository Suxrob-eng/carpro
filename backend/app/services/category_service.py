from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.category import Category
from backend.app.schemas.category import CategoryCreate, CategoryUpdate
from typing import List, Optional, Tuple


class CategoryService:
    
    @staticmethod
    def get_all_categories(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None
    ) -> Tuple[List[Category], int]:
        query = db.query(Category)
        
        if search:
            query = query.filter(Category.name.ilike(f"%{search}%"))
        
        total = query.count()
        categories = query.offset(skip).limit(limit).all()
        
        return categories, total
    
    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()
    
    @staticmethod
    def get_category_by_name(db: Session, name: str) -> Optional[Category]:
        return db.query(Category).filter(Category.name == name).first()
    
    @staticmethod
    def create_category(db: Session, category_data: CategoryCreate) -> Category:
        existing = CategoryService.get_category_by_name(db, category_data.name)
        if existing:
            raise ValueError("Category with this name already exists")
        
        new_category = Category(name=category_data.name)
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return new_category
    
    @staticmethod
    def update_category(
        db: Session, 
        category_id: int, 
        category_data: CategoryUpdate
    ) -> Category:
        category = CategoryService.get_category_by_id(db, category_id)
        if not category:
            raise ValueError("Category not found")
        
        if category_data.name is not None:
            existing = CategoryService.get_category_by_name(db, category_data.name)
            if existing and existing.id != category_id:
                raise ValueError("Category with this name already exists")
            category.name = category_data.name
        
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def delete_category(db: Session, category_id: int) -> None:
        category = CategoryService.get_category_by_id(db, category_id)
        if not category:
            raise ValueError("Category not found")
        
        db.delete(category)
        db.commit()