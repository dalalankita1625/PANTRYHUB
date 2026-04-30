import express, { Request, Response } from 'express';
import Product from '../models/Product';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all products (with optional search and filter)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, source } = req.query;
    let query: any = {};

    if (search) {
      query.name = { $regex: search as string, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (source) {
      query.source = source;
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error((err as Error).message);
    if ((err as any).kind === 'ObjectId') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(500).send('Server Error');
  }
});

// Add new product (admin/farmer only)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      res.status(403).json({ message: 'Authorization denied' });
      return;
    }

    const newProduct = new Product({
      ...req.body,
      ...(req.user.role === 'farmer' && { source: 'Farmer', farmerId: req.user.id })
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

export default router;
