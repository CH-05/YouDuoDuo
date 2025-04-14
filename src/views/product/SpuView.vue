<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Upload } from '@element-plus/icons-vue'
import { 
  reqSpuList, 
  reqSpuDetail, 
  reqSaveSpu, 
  reqDeleteSpu,
  reqTrademarkList,
  reqSaleAttrList,
  reqSaveSaleAttr
} from '@/api/product/spu'
import { reqCategoryList } from '@/api/product/attr'
import { reqSaveSku, reqSpuSaleAttr } from '@/api/product/sku'
import { useUserStore } from '@/stores/modules/user'

// 状态定义
const loading = ref(false)
const spuList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategory = ref('')
const categoryOptions = ref([])
const trademarkOptions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加SPU')
const formRef = ref(null)
const dialogImageUrl = ref('')
const dialogImageVisible = ref(false)
const skuDialogVisible = ref(false)
const skuFormRef = ref(null)
const userStore = useUserStore()
const uploadRef = ref(null)
const fileList = ref([])
const skuUploadRef = ref(null)

// SPU表单数据
const spuForm = reactive({
  spu_id: '',
  spu_name: '',
  description: '',
  category_id: '',
  product_id: '',
  images: [],
  saleAttrs: []
})

// 表单验证规则
const rules = {
  spu_name: [
    { required: true, message: '请输入SPU名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  product_id: [
    { required: true, message: '请选择品牌', trigger: 'change' }
  ]
}

// 上传相关配置
const uploadAction = 'http://localhost:3000/product/spu/image/upload'
const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

// SKU上传配置
const skuUploadAction = 'http://localhost:3000/product/sku/image/upload'
const skuUploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

// SKU表单数据
const skuForm = reactive({
  sku_name: '',
  price: '',
  weight: '',
  stock: '',
  sku_desc: '',
  spu_id: '',
  category_id: '',
  product_id: '',
  images: [],
  attrValues: []
})

// SKU表单验证规则
const skuRules = {
  sku_name: [
    { required: true, message: '请输入SKU名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的价格格式', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '请输入重量', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的重量格式', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'blur' },
    { pattern: /^\d+$/, message: '请输入正确的库存数量', trigger: 'blur' }
  ]
}

// 获取SPU列表
const getSpuList = async () => {
  if (!selectedCategory.value) return
  
  try {
    loading.value = true
    const res = await reqSpuList(currentPage.value, pageSize.value, selectedCategory.value)
    if (res.code === 200) {
      spuList.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取SPU列表失败:', error)
    ElMessage.error('获取SPU列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const res = await reqCategoryList()
    if (res.code === 200) {
      categoryOptions.value = res.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  }
}

// 获取品牌列表
const getTrademarkList = async () => {
  try {
    const res = await reqTrademarkList()
    if (res.code === 200) {
      trademarkOptions.value = res.data.records
    }
  } catch (error) {
    console.error('获取品牌列表失败:', error)
    ElMessage.error('获取品牌列表失败')
  }
}

// 处理分类变化
const handleCategoryChange = (value) => {
  selectedCategory.value = value
  spuForm.category_id = value
  if (value) {
    getSpuList()
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getSpuList()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getSpuList()
}

// 重置表单
const resetForm = () => {
  Object.assign(spuForm, {
    spu_id: '',
    spu_name: '',
    description: '',
    category_id: selectedCategory.value,
    product_id: '',
    images: [],
    saleAttrs: []
  })
}

// 添加SPU
const addSpu = () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择分类')
    return
  }
  
  // 先重置表单和文件列表
  resetForm()
  fileList.value = []
  
  // 再打开对话框
  dialogVisible.value = true
  dialogTitle.value = '添加SPU'
}

// 修复图片URL的方法
const fixImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob')) {
    return url;
  }
  
  // 如果是相对路径，添加baseURL
  return url.startsWith('/') ? `http://localhost:3000${url}` : `http://localhost:3000/${url}`;
}

// 编辑SPU
const editSpu = async (row) => {
  try {
    // 先重置表单，避免旧数据残留
    resetForm()
    
    // 清空文件列表
    fileList.value = []
    
    console.log('开始获取SPU详情，ID:', row.spu_id)
    const res = await reqSpuDetail(row.spu_id)
    
    if (res.code === 200) {
      // 确保销售属性数据格式正确
      let formattedSaleAttrs = []
      if (Array.isArray(res.data.sale_attrs)) {
        formattedSaleAttrs = res.data.sale_attrs.map(attr => ({
          attr_id: attr.attr_id,
          attr_name: attr.attr_name,
          attr_value: attr.attr_value || ''
        }))
      }
      
      // 确保图片格式正确
      let formattedImages = []
      if (Array.isArray(res.data.images)) {
        formattedImages = res.data.images.map(img => {
          return {
            image_id: img.image_id,
            image_name: img.image_name || '图片',
            image_url: fixImageUrl(img.image_url)
          };
        });
      }
      
      // 直接设置文件列表
      fileList.value = formattedImages.map(img => ({
        name: img.image_name || '图片',
        url: img.image_url,
        status: 'success'
      }));
      
      // 将数据赋值给表单
      Object.assign(spuForm, {
        spu_id: res.data.spu_id,
        spu_name: res.data.spu_name,
        description: res.data.description || '',
        category_id: res.data.category_id,
        product_id: res.data.product_id,
        images: formattedImages,
        saleAttrs: formattedSaleAttrs
      })
      
      // 确保分类和品牌已加载
      if (!categoryOptions.value.length) {
        await getCategoryList()
      }
      
      if (!trademarkOptions.value.length) {
        await getTrademarkList()
      }
      
      // 如果没有设置选中分类，手动设置
      if (!selectedCategory.value) {
        selectedCategory.value = res.data.category_id
      }
      
      // 最后打开对话框
      dialogVisible.value = true
      dialogTitle.value = '编辑SPU'
    } else {
      ElMessage.error(res.message || '获取SPU详情失败')
    }
  } catch (error) {
    console.error('获取SPU详情失败:', error)
    ElMessage.error('获取SPU详情失败: ' + (error.message || '未知错误'))
  }
}

// 删除SPU
const deleteSpu = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.spu_name} 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await reqDeleteSpu(row.spu_id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      if (spuList.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      getSpuList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 图片上传相关方法
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = fixImageUrl(file.url);
  dialogImageVisible.value = true;
}

const handleRemove = (file) => {
  const index = spuForm.images.findIndex(img => img.image_url === file.url)
  if (index !== -1) {
    spuForm.images.splice(index, 1)
  }
}

const handleUploadSuccess = (response, uploadFile) => {
  if (response.code === 200) {
    // 确保URL是完整的
    const imageUrl = fixImageUrl(response.data);
    
    spuForm.images.push({
      image_name: uploadFile.name,
      image_url: imageUrl
    });
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(response.message || '上传失败');
  }
}

const beforeUpload = (file) => {
  const isImage = /^image\//.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  return true
}

// 销售属性相关方法
const addSaleAttr = () => {
  spuForm.saleAttrs.push({
    attr_name: '',
    attr_value: ''
  })
}

// 删除销售属性
const removeSaleAttr = (index) => {
  spuForm.saleAttrs.splice(index, 1)
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 验证图片
    if (spuForm.images.length === 0) {
      ElMessage.warning('请至少上传一张SPU图片')
      return
    }
    
    // 验证销售属性
    if (spuForm.saleAttrs.length === 0) {
      ElMessage.warning('请至少添加一个销售属性')
      return
    }
    
    // 验证销售属性数据
    for (const attr of spuForm.saleAttrs) {
      if (!attr.attr_name) {
        ElMessage.warning('销售属性名称不能为空')
        return
      }
      if (!attr.attr_value) {
        ElMessage.warning(`销售属性 "${attr.attr_name}" 没有属性值`)
        return
      }
    }
    
    // 构造提交数据
    const submitData = {
      ...spuForm,
      category_id: selectedCategory.value,
      images: spuForm.images.map(img => ({
        image_url: img.image_url,
        image_name: img.image_name
      })),
      sale_attrs: spuForm.saleAttrs.map(attr => ({
        attr_name: attr.attr_name,
        attr_value: attr.attr_value
      }))
    }
    
    console.log('提交的数据:', submitData)
    
    const res = await reqSaveSpu(submitData)
    if (res.code === 200) {
      ElMessage.success(spuForm.spu_id ? '修改成功' : '添加成功')
      dialogVisible.value = false
      getSpuList()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败: ' + error.message)
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  // 重置表单
  resetForm()
  // 清空文件列表
  fileList.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 添加SKU
const addSku = async (row) => {
  try {
    skuDialogVisible.value = true
    // 重置表单
    Object.assign(skuForm, {
      sku_name: '',
      price: '',
      weight: '',
      stock: '',
      sku_desc: '',
      spu_id: row.spu_id,
      category_id: selectedCategory.value,
      product_id: row.product_id,
      images: [],
      attrValues: []
    })
    
    // 获取SPU销售属性
    const res = await reqSpuSaleAttr(row.spu_id)
    
    if (res.code === 200 && res.data) {
      // 处理销售属性数据
      skuForm.attrValues = res.data.map(attr => ({
        spu_sale_attr_id: attr.attr_id,
        attr_name: attr.attr_name,
        spu_sale_attr_value_id: '',
        attr_values: attr.attr_values || []
      }))
    } else {
      ElMessage.warning('获取销售属性失败')
    }
  } catch (error) {
    console.error('初始化SKU表单失败:', error)
    ElMessage.error('初始化SKU表单失败')
  }
}

// SKU图片上传相关方法
const handleSkuPictureCardPreview = (file) => {
  dialogImageUrl.value = fixImageUrl(file.url);
  dialogImageVisible.value = true;
}

const handleSkuRemove = (file) => {
  const index = skuForm.images.findIndex(img => img.img_url === file.url)
  if (index !== -1) {
    skuForm.images.splice(index, 1)
  }
}

const handleSkuUploadSuccess = (response, uploadFile) => {
  if (response.code === 200) {
    // 确保URL是完整的
    const imageUrl = fixImageUrl(response.data);
    
    skuForm.images.push({
      img_name: uploadFile.name,
      img_url: imageUrl,
      is_default: skuForm.images.length === 0 ? 1 : 0
    })
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const beforeSkuUpload = (file) => {
  const isImage = /^image\/(jpeg|png|gif|jpg)/.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG/GIF 格式的图片!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  return true
}

// 提交SKU表单
const submitSkuForm = async () => {
  if (!skuFormRef.value) return
  
  try {
    await skuFormRef.value.validate()
    
    // 验证图片
    if (skuForm.images.length === 0) {
      ElMessage.warning('请至少上传一张SKU图片')
      return
    }
    
    // 验证销售属性
    for (const attr of skuForm.attrValues) {
      if (!attr.spu_sale_attr_value_id) {
        ElMessage.warning(`请选择${attr.attr_name}的值`)
        return
      }
    }
    
    // 构造提交数据
    const submitData = {
      ...skuForm,
      price: Number(skuForm.price),
      weight: Number(skuForm.weight),
      stock: Number(skuForm.stock)
    }
    
    const res = await reqSaveSku(submitData)
    if (res.code === 200) {
      ElMessage.success('添加SKU成功')
      skuDialogVisible.value = false
      
      // 清空SKU表单和图片
      skuFormRef.value.resetFields()
      if (skuUploadRef.value) {
        skuUploadRef.value.clearFiles()
      }
      skuForm.images = []
    }
  } catch (error) {
    console.error('添加SKU失败:', error)
    ElMessage.error('添加SKU失败')
  }
}

// SKU对话框关闭处理
const handleSkuDialogClose = () => {
  skuFormRef.value?.resetFields()
  Object.assign(skuForm, {
    sku_name: '',
    price: '',
    weight: '',
    stock: '',
    sku_desc: '',
    spu_id: '',
    category_id: '',
    product_id: '',
    images: [],
    attrValues: []
  })
  
  // 清空SKU上传组件的文件列表
  if (skuUploadRef.value) {
    skuUploadRef.value.clearFiles()
  }
}

// 处理属性值失去焦点
const handleAttrValueBlur = (value) => {
  if (!value.value_name.trim()) {
    ElMessage.warning('属性值不能为空')
  }
}

// 强制重新加载上传组件
const forceReloadUploader = async () => {
  if (!uploadRef.value) {
    console.warn('上传组件引用不存在，无法重载');
    return;
  }
  
  if (!spuForm.images || spuForm.images.length === 0) {
    return;
  }
  
  // 直接设置文件列表
  fileList.value = spuForm.images.map(img => ({
    name: img.image_name || '图片',
    url: img.image_url,
    status: 'success'
  }));
};

// 添加SPU对话框打开后的事件处理
const handleDialogOpened = () => {
  // 不做任何操作，避免重复设置引起抖动
}

onMounted(async () => {
  await getCategoryList()
  await getTrademarkList()
})
</script>

<template>
  <div class="spu-container">
    <el-card class="box-card">
      <!-- 分类选择 -->
      <el-form :inline="true" class="category-form">
        <el-form-item label="选择分类：">
          <el-select
            v-model="selectedCategory"
            placeholder="请选择分类"
            clearable
            @change="handleCategoryChange"
            style="width: 200px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="operation-area" v-if="selectedCategory">
        <el-button type="primary" :icon="Plus" @click="addSpu">
          添加SPU
        </el-button>
      </div>

      <!-- SPU列表 -->
      <el-table
        v-loading="loading"
        :data="spuList"
        border
        style="margin-top: 20px"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="spu_name" label="SPU名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="trademark_name" label="品牌名称" width="120" />
        <el-table-column label="操作" width="250" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              circle
              @click="editSpu(row)"
              title="修改SPU"
            />
            <el-button
              type="success"
              :icon="Plus"
              circle
              @click="addSku(row)"
              title="添加SKU"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              @click="deleteSpu(row)"
              title="删除SPU"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 15, 20]"
        :total="total"
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- SPU表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
      @opened="handleDialogOpened"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="spuForm"
        :rules="rules"
        label-width="100px"
      >
        <!-- SPU基本信息 -->
        <el-form-item label="SPU名称" prop="spu_name">
          <el-input v-model="spuForm.spu_name" placeholder="请输入SPU名称" />
        </el-form-item>
        
        <el-form-item label="品牌" prop="product_id">
          <el-select v-model="spuForm.product_id" placeholder="请选择品牌" style="width: 100%">
            <el-option
              v-for="item in trademarkOptions"
              :key="item.product_id"
              :label="item.tmName"
              :value="item.product_id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="spuForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入SPU描述"
          />
        </el-form-item>

        <!-- SPU图片上传 -->
        <el-form-item label="SPU图片">
          <el-upload
            ref="uploadRef"
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :on-preview="handlePictureCardPreview"
            :before-upload="beforeUpload"
            :auto-upload="true"
            :file-list="fileList"
            :key="spuForm.spu_id || 'new'"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogImageVisible" width="50%">
            <img :src="dialogImageUrl" alt="Preview Image" style="max-width: 100%; margin: 0 auto; display: block;" />
          </el-dialog>
        </el-form-item>

        <!-- 销售属性 -->
        <el-form-item label="销售属性">
          <div class="sale-attrs">
            <div v-for="(attr, index) in spuForm.saleAttrs" :key="index" style="margin-bottom: 10px">
              <el-input 
                v-model="attr.attr_name" 
                placeholder="属性名称"
                style="width: 150px; margin-right: 10px"
              />
              <el-input 
                v-model="attr.attr_value" 
                placeholder="属性值（多个值用逗号分隔）"
                style="width: 300px; margin-right: 10px"
              />
              <el-button type="danger" @click="removeSaleAttr(index)">删除</el-button>
            </div>
            <el-button type="primary" @click="addSaleAttr">添加销售属性</el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- SKU表单对话框 -->
    <el-dialog
      v-model="skuDialogVisible"
      title="添加SKU"
      width="700px"
      @close="handleSkuDialogClose"
    >
      <el-form
        ref="skuFormRef"
        :model="skuForm"
        :rules="skuRules"
        label-width="100px"
      >
        <el-form-item label="SKU名称" prop="sku_name">
          <el-input
            v-model="skuForm.sku_name"
            placeholder="请输入SKU名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="skuForm.price"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="重量" prop="weight">
          <el-input-number
            v-model="skuForm.weight"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 200px"
          />
          <span class="unit">kg</span>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number
            v-model="skuForm.stock"
            :min="0"
            :precision="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="描述" prop="sku_desc">
          <el-input
            v-model="skuForm.sku_desc"
            type="textarea"
            :rows="3"
            placeholder="请输入SKU描述"
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            ref="skuUploadRef"
            :action="skuUploadAction"
            :headers="skuUploadHeaders"
            list-type="picture-card"
            :on-preview="handleSkuPictureCardPreview"
            :on-remove="handleSkuRemove"
            :on-success="handleSkuUploadSuccess"
            :before-upload="beforeSkuUpload"
            multiple
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogImageVisible">
            <img :src="dialogImageUrl" alt="Preview Image" style="max-width: 100%" />
          </el-dialog>
        </el-form-item>
        <el-form-item
          v-for="(attr, index) in skuForm.attrValues"
          :key="index"
          :label="attr.attr_name"
          required
        >
          <el-select
            v-model="attr.spu_sale_attr_value_id"
            placeholder="请选择属性值"
          >
            <el-option
              v-for="value in attr.attr_values"
              :key="value.value_id"
              :label="value.value_name"
              :value="value.value_id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitSkuForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.spu-container {
  padding: 20px;

  .category-form {
    margin-bottom: 20px;
  }

  .operation-area {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .unit {
    margin-left: 10px;
    color: #666;
  }
}
</style>