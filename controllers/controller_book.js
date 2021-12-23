const common = require('../config/common');
const msg = require('../value/message');
require('date-utils');

//책 모두 리스트 가져오기
//책 ISBN, 책 이름으로 검색하기 


//책 리스트 모두 가져오기
async function book_get_all() {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn);
    try {

        var query = `SELECT EXISTS (SELECT * FROM book) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};



        if (output[0][0].SUCCESS == 0) {
            result = {
                code: 500,
                rows: 0,
                output: "책이 없습니다."
            }
            return result
        } else {
            query = `SELECT * FROM book;`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        }
        return result
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    } finally {
        connection.release();
    }
}

//책 ISBN, 책, 저자 이름으로 검색하기(type, value)
async function book_get_by_type(type, value) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn);

    try {
        //존재하는 book_list인지 확인
        let query = `SELECT * FROM book WHERE ${connection.escape(type).substring(1,type.length+2-1)} = ${connection.escape(value)};`;
        console.log({query});
        let [book_list] = await connection.query(query);

        if (!book_list.length) {
            //book_list이 존재 하지 않는 경우
            return common.successCode(0, "해당 도서가 없습니다.");
        }

        return common.successCode(book_list.length, book_list);

    } catch (err) {
        console.log({err});
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
}


//책 추가
async function book_create_book(title, author, publisher, isbn, link) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)
   

    try {

        //기존 책인지 확인
        let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn=${connection.escape(isbn)}) AS SUCCESS;`;
        let [output] = await connection.query(query);
        var result = {};
        if(output[0].SUCCESS>0){
           return common.successCode(output.length, "이미 추가된 책입니다."); 
        }

        //----------------
        //책 추가하기 

        query = `INSERT INTO book(title, author, publisher, isbn, link)
                    VALUES(${connection.escape(title)}, ${connection.escape(author)}, ${connection.escape(publisher)}, ${connection.escape(isbn)}, ${connection.escape(link)});`;
        console.log(query);
        await connection.query(query);
        
        query = `SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}` 

        output = await connection.query(query);

        return common.successCode(output.length, output[0])
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: "오류"
        }
        return result
    } finally {
        connection.release();
    }
}

//책 수정
async function book_modify_book(title, author, publisher, isbn, link, id) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)
   

    try {

        //기존 책인지 확인
        let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn=${connection.escape(isbn)}) AS SUCCESS;`;
        let [output] = await connection.query(query);
        var result = {};
        if(output[0].SUCCESS<0){
           return common.successCode(output.length, "변경할 기존 책이 없습니다."); 
        }

        //----------------
        //책 추가하기 

        query = `UPDATE book SET 
                    title = ${connection.escape(title)}, 
                    author = ${connection.escape(author)}, 
                    publisher = ${connection.escape(publisher)}, 
                    isbn = ${connection.escape(isbn)}, 
                    link = ${connection.escape(link)} 
                WHERE _id = ${connection.escape(id)}`;
        console.log(query);
        await connection.query(query);
        
        query = `SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}`; 

        output = await connection.query(query);

        return common.successCode(output.length, output[0])
    } catch (err) {
        console.error({ err: err })
        var result = {
            code: 500,
            rows: -1,
            output: "오류"
        }
        return result
    } finally {
        connection.release();
    }
}

//책 삭제 (key=isbn)
async function book_delete_book(isbn) {
    let pool = common.getPool();
    let connection = await pool.getConnection(async conn => conn)

    try {
        //존재하는 책인지 확인
        let query = `SELECT EXISTS (SELECT * FROM book WHERE isbn = ${connection.escape(isbn)}) AS SUCCESS;;`;
        let [output] = await connection.query(query);


        if (output[0].SUCCESS==0) {
            //isbn에 해당 도서가 없습니다.
            return common.successCode(0, `${msg.code.S001}`); // 해당도서가 없습니다.
        }

        query = `DELETE FROM book WHERE isbn=${connection.escape(isbn)};`;
        await connection.query(query);
        return common.successCode(1, `${msg.code.S004}`); //삭제되었습니다.

    } catch (err) {
        return common.errorCode("오류");
    } finally {
        connection.release();
    }
}





module.exports = {
    book_get_all,
    book_get_by_type,
    book_create_book,
    book_delete_book,
    book_modify_book,

}

