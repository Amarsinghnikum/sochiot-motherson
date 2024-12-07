
import React from 'react'
import Admin from './Component/admin/Admin'

import { BrowserRouter, Route , Routes } from 'react-router-dom'

import Counter from "./Component/Counter/Counterr"
const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
        <Route path='' element={<Counter/>}/>
          <Route path='/admin' element={<Admin/>}/>
        </Routes>
      </BrowserRouter>
   
    </div>
  )
}

export default App
